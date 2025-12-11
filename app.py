from flask import Flask, render_template, request, redirect, url_for, flash, session
from db import get_connection
import cx_Oracle
import random
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'skyvoyage_secret_key'  # Güvenlik için gerekli

# ---------------------------------------------------------
# 1. ANA SAYFA VE UÇUŞ ARAMA
# ---------------------------------------------------------
@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # Formdan gelen veriler
        from_loc = request.form.get('from_city') # HTML'de name="from_city" eklemelisin
        to_loc = request.form.get('to_city')     # HTML'de name="to_city" eklemelisin
        date_input = request.form.get('flight_date') # HTML'de name="flight_date"
        
        # Tarih formatını ayarla (HTML'den YYYY-MM-DD gelir)
        try:
            search_date = datetime.strptime(date_input, '%Y-%m-%d').date()
        except:
            search_date = None

        conn = get_connection()
        cursor = conn.cursor()
        
        # Basit bir arama sorgusu (Kalkış yeri veya varış yerine göre)
        # Not: ER diyagramında Flight tablosunda "City" alanı yok, Gate ve DepartureTime var.
        # Gerçek senaryoda Havalimanı tablosu gerekir ama burada 'GateNo' üzerinden simüle edelim
        # veya tüm uçuşları listeleyelim.
        
        sql = """
            SELECT f.flightNo, f.departureTime, f.gateNo, a.modelNo, f.landingTime
            FROM Flight f
            JOIN Airplane a ON f.fregNo = a.regNo
            WHERE TRUNC(f.departureTime) = TO_DATE(:1, 'YYYY-MM-DD')
        """
        
        # Eğer tarih seçilmediyse tüm uçuşları getir (Demo için)
        if not date_input:
             sql = """
                SELECT f.flightNo, f.departureTime, f.gateNo, a.modelNo, f.landingTime
                FROM Flight f
                JOIN Airplane a ON f.fregNo = a.regNo
             """
             cursor.execute(sql)
        else:
             cursor.execute(sql, (date_input,))
             
        flights = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Arama sonuçlarını göstermek için (geçici olarak mytrips şablonunu kullanabiliriz veya result sayfası yapabilirsin)
        # Şimdilik direkt ilk uçuşu seçmiş gibi passenger_info'ya yönlendirelim (Demo)
        if flights:
            session['selected_flight'] = flights[0][0] # İlk uçuşun ID'sini hafızaya al
            return redirect(url_for('passenger_info'))
        else:
            flash("Uçuş bulunamadı!", "error")
            
    return render_template('index.html')

# ---------------------------------------------------------
# 2. YOLCU BİLGİLERİ GİRİŞİ
# ---------------------------------------------------------
@app.route('/passenger_info', methods=['GET', 'POST'])
def passenger_info():
    if request.method == 'POST':
        # HTML formundan verileri al (name="..." alanları)
        first_name = request.form['first_name']
        last_name = request.form['last_name'] # HTML'de last_name yoksa ekle
        dob = request.form['dob']
        ssn = request.form['ssn']  # Passport/ID Number
        email = request.form['email']
        phone = request.form['phone']
        
        # Verileri oturumda (session) tutalım, ödeme adımında kaydedeceğiz
        session['passenger'] = {
            'ssn': ssn,
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
            'phone': phone,
            'dob': dob,
            'gender': 'U', # Formda yoksa default
            'nationality': 'Unknown' 
        }
        
        return redirect(url_for('booking_confirmation'))
        
    return render_template('passenger_info.html')

# ---------------------------------------------------------
# 3. REZERVASYON ONAY VE KAYIT (Booking Summary)
# ---------------------------------------------------------
@app.route('/confirm_booking', methods=['GET', 'POST'])
def booking_confirmation():
    # Session'dan bilgileri al
    flight_id = session.get('selected_flight')
    passenger = session.get('passenger')
    
    if not flight_id or not passenger:
        return redirect(url_for('index'))

    # Eğer POST ise (Onayla butonuna basıldıysa) veritabanına yaz
    if request.method == 'POST':
        conn = get_connection()
        cursor = conn.cursor()
        
        try:
            # 1. Yolcu Kaydı (Varsa güncelleme, yoksa ekleme mantığı gerekir ama burada direkt insert deneyelim)
            # Önce yolcu var mı kontrol et
            check_sql = "SELECT SSN FROM Passenger WHERE SSN = :1"
            cursor.execute(check_sql, (passenger['ssn'],))
            if not cursor.fetchone():
                ins_pass = """
                    INSERT INTO Passenger (SSN, email, firstName, lastName, gender, dateOfBirth, phoneNumber)
                    VALUES (:1, :2, :3, :4, :5, TO_DATE(:6, 'YYYY-MM-DD'), :7)
                """
                cursor.execute(ins_pass, (
                    passenger['ssn'], passenger['email'], passenger['first_name'], 
                    passenger['last_name'], passenger['gender'], passenger['dob'], passenger['phone']
                ))
            
            # 2. Passenger Nationality (Opsiyonel)
            
            # 3. Booking Kaydı
            # Auto Increment olmadığı için manuel tarih ve veri giriyoruz
            booking_date = datetime.now()
            
            ins_book = """
                INSERT INTO Booking (fNo, bSSN, bookingDate, seatNo, ticketPrice, baggageCount)
                VALUES (:1, :2, :3, :4, :5, :6)
            """
            # SeatNo ve Price şimdilik sabit (Demo)
            cursor.execute(ins_book, (flight_id, passenger['ssn'], booking_date, '12A', 1500, 1))
            
            # 4. Sınıf Kaydı (Economy varsayılan)
            ins_eco = "INSERT INTO EconomyClass (EflightNo, ESSN, EbookingDate) VALUES (:1, :2, :3)"
            cursor.execute(ins_eco, (flight_id, passenger['ssn'], booking_date))
            
            conn.commit()
            
            # PNR oluştur (Demo amaçlı SSN sonu + Uçuş No)
            pnr = f"PNR-{flight_id}-{passenger['ssn'][-4:]}"
            
            return render_template('confirmation.html', pnr=pnr)
            
        except cx_Oracle.Error as e:
            conn.rollback()
            return f"Hata oluştu: {e}"
        finally:
            conn.close()

    # GET isteği ise özeti göster (booking.html)
    return render_template('booking.html', passenger=passenger, flight_id=flight_id)

# ---------------------------------------------------------
# 4. BİLETLERİM (My Trips)
# ---------------------------------------------------------
@app.route('/mytrips')
def mytrips():
    # Normalde login olan kullanıcının SSN'i session'da olmalı.
    # Demo için session'daki son yolcuyu kullanalım.
    passenger = session.get('passenger')
    if not passenger:
        flash("Lütfen önce işlem yapın.", "warning")
        return redirect(url_for('index'))
        
    conn = get_connection()
    cursor = conn.cursor()
    
    # Kullanıcının biletlerini çek (Booking + Flight + Airplane Join)
    sql = """
        SELECT b.bookingDate, f.flightNo, f.departureTime, f.gateNo, a.modelNo, b.seatNo, b.ticketPrice
        FROM Booking b
        JOIN Flight f ON b.fNo = f.flightNo
        JOIN Airplane a ON f.fregNo = a.regNo
        WHERE b.bSSN = :1
        ORDER BY f.departureTime DESC
    """
    
    cursor.execute(sql, (passenger['ssn'],))
    trips = cursor.fetchall()
    conn.close()
    
    return render_template('mytrips.html', trips=trips)

# ---------------------------------------------------------
# 5. LOGIN (Opsiyonel)
# ---------------------------------------------------------
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Basit bir login simülasyonu
        email = request.form.get('email') # HTML'de name="email" olmalı
        # Şifre kontrolü ER diyagramında yok, sadece email ile giriş yapalım
        
        conn = get_connection()
        cursor = conn.cursor()
        sql = "SELECT SSN, firstName, lastName FROM Passenger WHERE email = :1"
        cursor.execute(sql, (email,))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            session['passenger'] = {
                'ssn': user[0],
                'first_name': user[1],
                'last_name': user[2],
                'email': email
            }
            return redirect(url_for('mytrips'))
        else:
            flash("Kullanıcı bulunamadı", "error")
            
    return render_template('login.html')

if __name__ == '__main__':
    app.run(debug=True)