
import MainLayout from "@/layouts/MainLayout";
import BookingCalendar from "@/components/Calendar";

const Booking = () => {
  return (
    <MainLayout>
      <div className="min-h-screen pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold mb-3">Онлайн запись на сервис</h1>
            <p className="text-foreground/70 max-w-xl mx-auto">
              Выберите удобную дату, время и услуги для записи на обслуживание вашего автомобиля
            </p>
          </div>
          
          <BookingCalendar />
        </div>
      </div>
    </MainLayout>
  );
};

export default Booking;
