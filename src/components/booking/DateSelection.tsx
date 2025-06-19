
import { Calendar } from "@/components/ui/calendar";
import { isDisabledDate } from "@/utils/bookingUtils";

interface DateSelectionProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

const DateSelection = ({ date, setDate }: DateSelectionProps) => {
  return (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Выберите дату</h3>
      <div className="rounded-lg overflow-hidden bg-white shadow">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={isDisabledDate}
          className="rounded-lg border-0 pointer-events-auto"
        />
      </div>
    </div>
  );
};

export default DateSelection;
