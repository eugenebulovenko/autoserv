
import { Button } from "@/components/ui/button";
import { timeSlots } from "@/types/booking";

interface TimeSelectionProps {
  date: Date | undefined;
  time: string | null;
  setTime: (time: string) => void;
}

const TimeSelection = ({ date, time, setTime }: TimeSelectionProps) => {
  return (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">
        Выберите время - {date?.toLocaleDateString('ru-RU')}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {timeSlots.map((slot) => (
          <Button
            key={slot}
            variant={time === slot ? "default" : "outline"}
            onClick={() => setTime(slot)}
            className="h-12"
          >
            {slot}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TimeSelection;
