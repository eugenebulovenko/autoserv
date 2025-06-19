import { useRef } from "react";

export function usePrint() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (printWindow) {
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Печать заказ-наряда</title></head><body>${printContents}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  return { printRef, handlePrint };
}
