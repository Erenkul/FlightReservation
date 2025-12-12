from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    session,
    send_from_directory,
)
from db import get_connection
import cx_Oracle
from datetime import datetime
import logging
import os
from decimal import Decimal


app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "skyvoyage-secret-key")
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

try:
    cx_Oracle.init_oracle_client(lib_dir=r"C:\Users\Ozi\Desktop\sql\instantclient_21_19")
except Exception as e:
    print("Client zaten yüklü veya hata:", e)


# --- Static aliases for component files (keeps existing folder names) ---
@app.route("/static/js/components/<path:filename>")
def serve_components(filename):
    return send_from_directory("static/components", filename)


# --- Helpers -----------------------------------------------------------------
def fetch_flights(from_city=None, to_city=None, flight_date=None):
    """
    Basic flight search. Filters are optional to avoid breaking schema differences.
    """
    conn = get_connection()
    if not conn:
        return None, "Veritabanı bağlantısı kurulamadı"

    try:
        cursor = conn.cursor()
        sql = """
            SELECT f.flightNo,
                   f.departureTime,
                   f.gateNo,
                   a.modelNo,
                   f.landingTime
            FROM Flight f
            JOIN Airplane a ON f.fregNo = a.regNo
            WHERE 1=1
        """

        params = []
        if flight_date:
            sql += " AND TRUNC(f.departureTime) = TO_DATE(:flight_date, 'YYYY-MM-DD')"
            params.append(flight_date)

        # from_city / to_city filters are kept optional to avoid schema mismatch
        # Uncomment if columns exist: f.fromCity, f.toCity
        # if from_city:
        #     sql += " AND LOWER(f.fromCity) = LOWER(:from_city)"
        #     params.append(from_city)
        # if to_city:
        #     sql += " AND LOWER(f.toCity) = LOWER(:to_city)"
        #     params.append(to_city)

        sql += " ORDER BY f.departureTime ASC"

        cursor.execute(sql, params)
        flights = cursor.fetchall()
        return flights, None
    except cx_Oracle.Error as e:
        logger.exception("Flight query failed")
        return None, f"Sorgu hatası: {e}"
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


def format_flights(rows):
    """
    Convert DB rows into dictionaries so Jinja can render them easily.
    """
    formatted = []
    for row in rows or []:
        formatted.append(
            {
                "flight": row[0],
                "depart_time": row[1].strftime("%Y-%m-%d %H:%M") if row[1] else "TBD",
                "arrival_time": row[4].strftime("%Y-%m-%d %H:%M") if len(row) > 4 and row[4] else "TBD",
                "gate": row[2],
                "aircraft": row[3],
                "price": 1500,
            }
        )
    return formatted


def fallback_flights():
    """
    Static flights for demo/boş sonuçlar.
    """
    return [
        {
            "flight": "1001",
            "depart_time": "2025-01-10 08:00",
            "arrival_time": "2025-01-10 12:00",
            "gate": "A10",
            "aircraft": "Boeing 737-800",
            "price": 1200,
        },
        {
            "flight": "1002",
            "depart_time": "2025-01-10 14:00",
            "arrival_time": "2025-01-10 18:00",
            "gate": "B20",
            "aircraft": "Airbus A320",
            "price": 1200,
        },
        {
            "flight": "2001",
            "depart_time": "2025-01-11 09:00",
            "arrival_time": "2025-01-11 15:00",
            "gate": "C30",
            "aircraft": "Airbus A330",
            "price": 3200,
        },
    ]


# 1. ANA SAYFA VE ARAMA
@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        from_city = request.form.get("from_city")
        to_city = request.form.get("to_city")
        flight_date = request.form.get("flight_date")

        flights, err = fetch_flights(from_city, to_city, flight_date)
        if err:
            flash(err, "error")
            return render_template("index.html")

        formatted = format_flights(flights)
        if not formatted:
            flash("Uçuş bulunamadı, örnek sonuçlar gösteriliyor.", "error")
            formatted = fallback_flights()

        session["search_results"] = formatted
        session["search_meta"] = {
            "from_city": from_city or "Any",
            "to_city": to_city or "Any",
            "flight_date": flight_date or "Flexible",
        }
        return redirect(url_for("search_result"))

    return render_template("index.html")


@app.route("/search_result")
def search_result():
    flights = session.get("search_results") or fallback_flights()
    search_meta = session.get("search_meta") or {}
    return render_template("search_result.html", flights=flights, search_meta=search_meta)


@app.route("/select_flight", methods=["POST"])
def select_flight():
    flight_no = request.form.get("flight_no")
    depart_time = request.form.get("depart_time")
    arrival_time = request.form.get("arrival_time")
    gate = request.form.get("gate")
    aircraft = request.form.get("aircraft")
    price = request.form.get("price", type=float)

    if not flight_no:
        flash("Uçuş seçimi yapılamadı.", "error")
        return redirect(url_for("search_result"))

    session["selected_flight"] = flight_no
    session["flight_details"] = {
        "no": flight_no,
        "dep": depart_time or "TBD",
        "arr": arrival_time or "TBD",
        "gate": gate or "—",
        "model": aircraft or "—",
        "price": price or 1500,
    }
    return redirect(url_for("passenger_info"))


# --- CRUD helpers for Booking -------------------------------------------------
def delete_booking(conn, flight_no, ssn, booking_date):
    """
    Silme sırasında alt tablolardaki kayıtları da temizler (Economy/Business).
    """
    cursor = conn.cursor()
    try:
        # Alt sınıflar
        cursor.execute(
            "DELETE FROM EconomyClass WHERE EflightNo = :1 AND ESSN = :2 AND EbookingDate = :3",
            (flight_no, ssn, booking_date),
        )
        cursor.execute(
            "DELETE FROM BusinessClass WHERE BflightNo = :1 AND BSSN = :2 AND BbookingDate = :3",
            (flight_no, ssn, booking_date),
        )
        # Ana kayıt
        cursor.execute(
            "DELETE FROM Booking WHERE fNo = :1 AND bSSN = :2 AND bookingDate = :3",
            (flight_no, ssn, booking_date),
        )
        conn.commit()
        return None
    except cx_Oracle.Error as e:
        conn.rollback()
        return str(e)
    finally:
        try:
            cursor.close()
        except Exception:
            pass


def update_booking(conn, flight_no, ssn, booking_date, seat_no=None, ticket_price=None, baggage_count=None):
    """
    Basit update: seatNo, ticketPrice, baggageCount alanlarını günceller.
    """
    cursor = conn.cursor()
    try:
        fields = []
        params = []
        if seat_no:
            fields.append("seatNo = :seatNo")
            params.append(seat_no)
        if ticket_price is not None:
            fields.append("ticketPrice = :ticketPrice")
            params.append(ticket_price)
        if baggage_count is not None:
            fields.append("baggageCount = :baggageCount")
            params.append(baggage_count)

        if not fields:
            return None  # Güncellenecek alan yok

        sql = "UPDATE Booking SET " + ", ".join(fields) + " WHERE fNo = :fNo AND bSSN = :bSSN AND bookingDate = :bDate"
        params.extend([flight_no, ssn, booking_date])
        cursor.execute(sql, params)
        conn.commit()
        return None
    except cx_Oracle.Error as e:
        conn.rollback()
        return str(e)
    finally:
        try:
            cursor.close()
        except Exception:
            pass

# 2. YOLCU BİLGİLERİ GİRİŞİ (GÜNCELLENDİ)
@app.route("/passenger_info", methods=["GET", "POST"])
def passenger_info():
    if not session.get("selected_flight"):
        return redirect(url_for("search_result"))

    if request.method == "POST":
        session["passenger"] = {
            "ssn": request.form["ssn"],
            "first_name": request.form["first_name"],
            "last_name": request.form["last_name"],
            "email": request.form["email"],
            "phone": request.form["phone"],
            "dob": request.form["dob"],
            "gender": "U", 
        }
        # DEĞİŞİKLİK: Doğrudan onaya gitmek yerine koltuk seçimine gidiyoruz
        return redirect(url_for("seat_selection"))
        
    return render_template("passenger_info.html")

# YENİ ROTA: KOLTUK SEÇİMİ
@app.route("/seat_selection", methods=["GET", "POST"])
def seat_selection():
    if not session.get("selected_flight"):
        return redirect(url_for("search_result"))

    if not session.get("passenger"):
        return redirect(url_for("passenger_info"))

    flight_id = session.get("selected_flight")
    
    # DB'den rezerve koltukları çek
    reserved_seats = []
    conn = get_connection()
    if conn:
        try:
            cursor = conn.cursor()
            sql = "SELECT seatNo FROM Booking WHERE fNo = :1 AND seatNo IS NOT NULL"
            cursor.execute(sql, (flight_id,))
            reserved_seats = [row[0] for row in cursor.fetchall()]
            cursor.close()
            conn.close()
        except Exception:
            pass

    if request.method == "POST":
        # Formdan gelen koltuk ve sınıf bilgisini al
        seat_no = request.form.get("selected_seat")
        class_type = request.form.get("class_type", "Economy")  # Economy veya Business
        if seat_no:
            session["selected_seat"] = seat_no
            session["class_type"] = class_type
            return redirect(url_for("confirm_booking"))
        else:
            flash("Lütfen bir koltuk seçin.", "error")
            
    return render_template("seat.html", reserved_seats=reserved_seats)

# 3. REZERVASYON ONAY (GÜNCELLENDİ)
@app.route("/confirm_booking", methods=["GET", "POST"])
def confirm_booking():
    flight_id = session.get("selected_flight")
    flight_data = session.get("flight_details")
    passenger = session.get("passenger")
    # DEĞİŞİKLİK: Session'dan seçilen koltuğu al, yoksa varsayılan ata
    selected_seat = session.get("selected_seat")

    if not flight_id or not passenger:
        return redirect(url_for("index"))
    if request.method == "GET" and not selected_seat:
        return redirect(url_for("seat_selection"))

    if request.method == "POST":
        conn = get_connection()
        if not conn:
            flash("Veritabanı bağlantısı kurulamadı!", "error")
            return redirect(url_for("index"))

        cursor = conn.cursor()
        try:
            # A) Yolcu Ekleme (Aynı kalıyor)
            check_user = "SELECT SSN FROM Passenger WHERE SSN = :1"
            cursor.execute(check_user, (passenger["ssn"],))
            
            if not cursor.fetchone():
                ins_pass = """
                    INSERT INTO Passenger (SSN, email, firstName, lastName, gender, dateOfBirth, phoneNumber)
                    VALUES (:1, :2, :3, :4, :5, TO_DATE(:6, 'YYYY-MM-DD'), :7)
                """
                cursor.execute(
                    ins_pass,
                    (
                        passenger["ssn"],
                        passenger["email"],
                        passenger["first_name"],
                        passenger["last_name"],
                        passenger["gender"],
                        passenger["dob"],
                        passenger["phone"],
                    ),
                )

            # B) Booking Ekleme (GÜNCELLENDİ)
            booking_date = datetime.now()
            
            # DEĞİŞİKLİK: seatNo parametresi artık dinamik (selected_seat)
            ins_book = """
                INSERT INTO Booking (fNo, bSSN, bookingDate, seatNo, ticketPrice, baggageCount)
                VALUES (:1, :2, :3, :4, :5, :6)
            """
            cursor.execute(
                ins_book,
                (
                    flight_id,
                    passenger["ssn"],
                    booking_date,
                    selected_seat,
                    flight_data.get("price", 1500) if flight_data else 1500,
                    1,
                ),
            )

            # Sınıf tipine göre EconomyClass veya BusinessClass'a ekle
            class_type = session.get("class_type", "Economy")
            if class_type == "Business":
                ins_business = "INSERT INTO BusinessClass (BflightNo, BSSN, BbookingDate) VALUES (:1, :2, :3)"
                cursor.execute(ins_business, (flight_id, passenger["ssn"], booking_date))
            else:
                ins_eco = "INSERT INTO EconomyClass (EflightNo, ESSN, EbookingDate) VALUES (:1, :2, :3)"
                cursor.execute(ins_eco, (flight_id, passenger["ssn"], booking_date))

            conn.commit()
            
            pnr_code = f"PNR{flight_id}{passenger['ssn'][-4:]}"
            return render_template(
                "confirmation.html",
                pnr=pnr_code,
                passenger=passenger,
                flight=flight_data,
                seat=selected_seat,
            )

        except cx_Oracle.Error as e:
            conn.rollback()
            flash(f"Hata oluştu: {e}", "error")
            return redirect(url_for("index"))
        finally:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass

    # GET isteği için sayfayı render et
    return render_template("booking.html", passenger=passenger, flight=flight_data, seat=selected_seat or "TBD")
# 4. BİLETLERİM (Login gerektirmiyor, tüm booking'leri gösterir)
@app.route("/mytrips")
def mytrips():
    conn = get_connection()
    if not conn:
        flash("Veritabanı bağlantısı kurulamadı!", "error")
        return render_template("mytrips.html", trips=[])

    cursor = conn.cursor()
    sql = """
        SELECT b.bookingDate,
               f.flightNo,
               f.departureTime,
               f.gateNo,
               a.modelNo,
               b.seatNo,
               b.ticketPrice,
               p.firstName,
               p.lastName,
               b.bSSN
        FROM Booking b
        JOIN Flight f ON b.fNo = f.flightNo
        JOIN Airplane a ON f.fregNo = a.regNo
        JOIN Passenger p ON b.bSSN = p.SSN
        ORDER BY b.bookingDate DESC
    """
    cursor.execute(sql)
    trips = cursor.fetchall()

    try:
        cursor.close()
        conn.close()
    except Exception:
        pass

    return render_template("mytrips.html", trips=trips)


# 5. Booking Delete (Login gerektirmiyor)
@app.route("/booking/delete", methods=["POST"])
def booking_delete():
    flight_no = request.form.get("flight_no")
    booking_date_raw = request.form.get("booking_date")
    ssn = request.form.get("ssn")  # Formdan alınacak

    if not (flight_no and booking_date_raw and ssn):
        flash("Eksik bilgi: flight_no, booking_date veya ssn.", "error")
        return redirect(url_for("mytrips"))

    try:
        booking_date = datetime.fromisoformat(booking_date_raw)
    except ValueError:
        flash("Tarih formatı hatalı.", "error")
        return redirect(url_for("mytrips"))

    conn = get_connection()
    if not conn:
        flash("Veritabanı bağlantısı kurulamadı!", "error")
        return redirect(url_for("mytrips"))

    err = delete_booking(conn, flight_no, ssn, booking_date)
    try:
        conn.close()
    except Exception:
        pass

    if err:
        flash(f"Silme hatası: {err}", "error")
    else:
        flash("Rezervasyon silindi.", "success")
    return redirect(url_for("mytrips"))


# 6. Booking Update (seat, price, baggage) - Login gerektirmiyor
@app.route("/booking/update", methods=["POST"])
def booking_update():
    flight_no = request.form.get("flight_no")
    booking_date_raw = request.form.get("booking_date")
    ssn = request.form.get("ssn")  # Formdan alınacak
    seat_no = request.form.get("seat_no") or None
    price_raw = request.form.get("ticket_price")
    baggage_raw = request.form.get("baggage_count")

    ticket_price = float(price_raw) if price_raw else None
    baggage_count = int(baggage_raw) if baggage_raw else None

    if not (flight_no and booking_date_raw and ssn):
        flash("Eksik bilgi: flight_no, booking_date veya ssn.", "error")
        return redirect(url_for("mytrips"))

    try:
        booking_date = datetime.fromisoformat(booking_date_raw)
    except ValueError:
        flash("Tarih formatı hatalı.", "error")
        return redirect(url_for("mytrips"))

    conn = get_connection()
    if not conn:
        flash("Veritabanı bağlantısı kurulamadı!", "error")
        return redirect(url_for("mytrips"))

    err = update_booking(conn, flight_no, ssn, booking_date, seat_no, ticket_price, baggage_count)
    try:
        conn.close()
    except Exception:
        pass

    if err:
        flash(f"Güncelleme hatası: {err}", "error")
    else:
        flash("Rezervasyon güncellendi.", "success")
    return redirect(url_for("mytrips"))


@app.route("/manage_bookings", methods=["GET", "POST"])
def manage_bookings():
    """
    Login gerekmeden tüm Booking kayıtlarını listeleyen basit yönetim ekranı.
    Insert / Update / Delete yapılabilir.
    """
    if request.method == "POST":
        action = request.form.get("action")
        conn = get_connection()
        if not conn:
            flash("Veritabanı bağlantısı kurulamadı!", "error")
            return redirect(url_for("manage_bookings"))
        try:
            cursor = conn.cursor()
            if action == "insert":
                fno = request.form.get("flight_no")
                ssn = request.form.get("ssn")
                seat_no = request.form.get("seat_no") or None
                price_raw = request.form.get("ticket_price")
                baggage_raw = request.form.get("baggage_count")
                booking_date_raw = request.form.get("booking_date")
                booking_date = datetime.fromisoformat(booking_date_raw) if booking_date_raw else datetime.now()
                ticket_price = Decimal(price_raw) if price_raw else None
                baggage = int(baggage_raw) if baggage_raw else None
                if not (fno and ssn):
                    flash("flight_no ve ssn zorunlu.", "error")
                else:
                    cursor.execute(
                        """
                        INSERT INTO Booking (fNo, bSSN, bookingDate, seatNo, ticketPrice, baggageCount)
                        VALUES (:1, :2, :3, :4, :5, :6)
                        """,
                        (fno, ssn, booking_date, seat_no, ticket_price, baggage),
                    )
                    cursor.execute(
                        "INSERT INTO EconomyClass (EflightNo, ESSN, EbookingDate) VALUES (:1, :2, :3)",
                        (fno, ssn, booking_date),
                    )
                    conn.commit()
                    flash("Booking eklendi.", "success")
            elif action == "update":
                fno = request.form.get("flight_no")
                ssn = request.form.get("ssn")
                booking_date_raw = request.form.get("booking_date")
                seat_no = request.form.get("seat_no") or None
                price_raw = request.form.get("ticket_price")
                baggage_raw = request.form.get("baggage_count")
                if not (fno and ssn and booking_date_raw):
                    flash("flight_no, ssn, booking_date zorunlu.", "error")
                else:
                    booking_date = datetime.fromisoformat(booking_date_raw)
                    err = update_booking(
                        conn,
                        fno,
                        ssn,
                        booking_date,
                        seat_no,
                        float(price_raw) if price_raw else None,
                        int(baggage_raw) if baggage_raw else None,
                    )
                    if err:
                        flash(f"Güncelleme hatası: {err}", "error")
                    else:
                        flash("Booking güncellendi.", "success")
            elif action == "delete":
                fno = request.form.get("flight_no")
                ssn = request.form.get("ssn")
                booking_date_raw = request.form.get("booking_date")
                if not (fno and ssn and booking_date_raw):
                    flash("flight_no, ssn, booking_date zorunlu.", "error")
                else:
                    booking_date = datetime.fromisoformat(booking_date_raw)
                    err = delete_booking(conn, fno, ssn, booking_date)
                    if err:
                        flash(f"Silme hatası: {err}", "error")
                    else:
                        flash("Booking silindi.", "success")
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass
        except Exception as e:
            flash(f"İşlem hatası: {e}", "error")
            try:
                conn.rollback()
            except Exception:
                pass
    bookings, err = fetch_all_bookings()
    if err:
        flash(err, "error")
        bookings = []
    return render_template("manage_bookings.html", bookings=bookings)


# 7. Raporlar (JOIN / GROUP BY / SUBQUERY örnekleri)
def fetch_reports():
    """
    Üç örnek sorgu: join + group by, group by + order by, subquery.
    """
    conn = get_connection()
    if not conn:
        return None, "Veritabanı bağlantısı kurulamadı!"

    data = {"top_flights": [], "capacity_over_avg": [], "bags_by_gate": []}
    err = None
    try:
        cur = conn.cursor()

        # 1) Join + GROUP BY + ORDER BY: uçuş başına yolcu sayısı
        cur.execute(
            """
            SELECT f.flightNo,
                   COUNT(*) AS pax_count,
                   MIN(b.bookingDate) AS first_booking,
                   MAX(b.bookingDate) AS last_booking
            FROM Booking b
            JOIN Flight f ON b.fNo = f.flightNo
            GROUP BY f.flightNo
            ORDER BY pax_count DESC, f.flightNo
            """
        )
        data["top_flights"] = cur.fetchall()

        # 2) Subquery: kapasitesi ortalamanın üstünde olan uçaklar/flightlar
        cur.execute(
            """
            SELECT f.flightNo,
                   a.modelNo,
                   a.capacity
            FROM Flight f
            JOIN Airplane a ON f.fregNo = a.regNo
            WHERE a.capacity > (SELECT AVG(capacity) FROM Airplane)
            ORDER BY a.capacity DESC, f.flightNo
            """
        )
        data["capacity_over_avg"] = cur.fetchall()

        # 3) GROUP BY + ORDER BY: gate bazlı toplam bagaj
        cur.execute(
            """
            SELECT f.gateNo,
                   SUM(NVL(b.baggageCount,0)) AS total_bags
            FROM Booking b
            JOIN Flight f ON b.fNo = f.flightNo
            GROUP BY f.gateNo
            ORDER BY total_bags DESC NULLS LAST
            """
        )
        data["bags_by_gate"] = cur.fetchall()

    except cx_Oracle.Error as e:
        err = f"Rapor sorgusu hatası: {e}"
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass

    return data, err


def fetch_all_bookings():
    """
    Yönetim ekranı için tüm booking kayıtlarını getirir.
    """
    conn = get_connection()
    if not conn:
        return [], "Veritabanı bağlantısı kurulamadı!"
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT b.bookingDate,
                   f.flightNo,
                   f.departureTime,
                   f.gateNo,
                   a.modelNo,
                   b.seatNo,
                   b.ticketPrice,
                   b.bSSN
            FROM Booking b
            JOIN Flight f ON b.fNo = f.flightNo
            JOIN Airplane a ON f.fregNo = a.regNo
            ORDER BY b.bookingDate DESC
            """
        )
        rows = cur.fetchall()
        return rows, None
    except cx_Oracle.Error as e:
        return [], f"Sorgu hatası: {e}"
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass


@app.route("/reports")
def reports():
    data, err = fetch_reports()
    if err:
        flash(err, "error")
        data = {"top_flights": [], "capacity_over_avg": [], "bags_by_gate": []}
    return render_template("reports.html", data=data)


# --- AUTHENTICATION ROUTES (LOGIN / REGISTER / LOGOUT) ---

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        ssn = request.form.get("password")  # Şifre yerine SSN kullanıyoruz (DB yapısına göre)
        
        conn = get_connection()
        if not conn:
            flash("Veritabanı bağlantısı yok.", "error")
            return render_template("login.html")
            
        try:
            cursor = conn.cursor()
            # Kullanıcıyı Email ve SSN ile sorgula
            sql = "SELECT SSN, firstName, lastName, email, phoneNumber, dateOfBirth FROM Passenger WHERE email = :1 AND SSN = :2"
            cursor.execute(sql, (email, ssn))
            user = cursor.fetchone()
            
            if user:
                # Oturum aç
                session["passenger"] = {
                    "ssn": user[0],
                    "first_name": user[1],
                    "last_name": user[2],
                    "email": user[3],
                    "phone": user[4],
                    # Tarih nesnesini string'e çeviriyoruz
                    "dob": user[5].strftime("%Y-%m-%d") if user[5] else None
                }
                flash(f"Hoşgeldiniz, {user[1]}!", "success")
                return redirect(url_for("mytrips"))
            else:
                flash("Hatalı Email veya Kimlik No (SSN).", "error")
                
        except cx_Oracle.Error as e:
            flash(f"Giriş hatası: {e}", "error")
        finally:
            try:
                conn.close()
            except:
                pass
                
    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        # Form verilerini al
        first_name = request.form.get("first_name")
        last_name = request.form.get("last_name")
        email = request.form.get("email")
        ssn = request.form.get("ssn")      # Password alanı yerine SSN
        phone = request.form.get("phone")
        dob_raw = request.form.get("dob")
        gender = request.form.get("gender", "U")

        conn = get_connection()
        if not conn:
            flash("Bağlantı hatası.", "error")
            return render_template("register.html")

        try:
            cursor = conn.cursor()
            # Ekleme sorgusu
            sql = """
                INSERT INTO Passenger (SSN, email, firstName, lastName, gender, dateOfBirth, phoneNumber)
                VALUES (:1, :2, :3, :4, :5, TO_DATE(:6, 'YYYY-MM-DD'), :7)
            """
            cursor.execute(sql, (ssn, email, first_name, last_name, gender, dob_raw, phone))
            conn.commit()
            
            flash("Kayıt başarılı! Lütfen giriş yapın.", "success")
            return redirect(url_for("login"))
            
        except cx_Oracle.Error as e:
            conn.rollback()
            flash(f"Kayıt hatası (SSN veya Email kullanılıyor olabilir): {e}", "error")
        finally:
            try:
                conn.close()
            except:
                pass

    return render_template("register.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("Çıkış yapıldı.", "success")
    return redirect(url_for("index"))




if __name__ == "__main__":
    app.run(debug=False)
    app.secret_key = "enbuyukgs"