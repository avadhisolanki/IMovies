import React from 'react';
import { Film, Calendar, Clock, MapPin, Printer, ShieldCheck, XCircle, QrCode } from 'lucide-react';

const DigitalTicket = ({ booking, onCancel, showCancel = true }) => {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCancelled = booking.paymentStatus === 'Cancelled';

  return (
    <div className="relative max-w-md w-full mx-auto bg-[#1a242f] border border-[#2c3b4d] rounded-2xl overflow-hidden shadow-2xl transition hover:border-[#00a8e1]/50 print:border-none print:shadow-none">
      
      {/* Top Header Banner */}
      <div className={`p-4 ${isCancelled ? 'bg-red-950/60 border-b border-red-800/40' : 'bg-gradient-to-r from-[#00a8e1] to-[#0077b6]'} text-black flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black">
            <Film className="w-4 h-4 text-[#00a8e1]" />
          </div>
          <div>
            <h3 className={`text-sm font-black tracking-tight ${isCancelled ? 'text-red-400' : 'text-black'}`}>
              iMovies PRIME PASS
            </h3>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isCancelled ? 'text-red-300' : 'text-black/80'}`}>
              {isCancelled ? 'BOOKING CANCELLED' : 'CONFIRMED CINEMA ADMISSION'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono font-bold block text-black/70">
            REF ID
          </span>
          <span className="text-xs font-mono font-black text-black">
            {booking.bookingId}
          </span>
        </div>
      </div>

      {/* Ticket Main Details */}
      <div className="p-5 space-y-4">
        {/* Movie Title */}
        <div>
          <span className="text-[10px] font-bold text-[#00a8e1] uppercase tracking-wider block">
            FEATURE FILM
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">
            {booking.movieName || 'Blockbuster Movie'}
          </h2>
        </div>

        {/* Theatre & Location */}
        <div className="flex items-start gap-2 text-xs text-gray-300">
          <MapPin className="w-4 h-4 text-[#00a8e1] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">{booking.theatreName}</p>
            <p className="text-gray-400 text-[11px]">{booking.location}</p>
          </div>
        </div>

        {/* Date & Time Grid */}
        <div className="grid grid-cols-2 gap-3 bg-[#151c24] p-3 rounded-lg border border-[#253241]">
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-[#00a8e1]" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Date</p>
              <p className="font-bold text-white">
                {new Date(booking.showDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-4 h-4 text-[#00a8e1]" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Time</p>
              <p className="font-bold text-white">{booking.showTime}</p>
            </div>
          </div>
        </div>

        {/* Seats Grid */}
        <div className="bg-[#151c24] p-3 rounded-lg border border-[#253241]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              RESERVED SEATS ({booking.selectedSeats?.length || 0})
            </span>
            <span className="text-[11px] font-bold text-[#00a8e1]">
              ₹{booking.totalAmount} Paid
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {booking.selectedSeats?.map((seat) => (
              <span
                key={seat}
                className="bg-[#253241] border border-[#00a8e1]/40 text-[#00a8e1] font-mono text-xs font-bold px-2 py-1 rounded"
              >
                {seat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Perforated divider look */}
      <div className="relative flex items-center justify-between px-2">
        <div className="w-5 h-5 -ml-4 rounded-full bg-[#0f171e] border-r border-[#2c3b4d]"></div>
        <div className="flex-1 border-b-2 border-dashed border-gray-700/60 mx-2"></div>
        <div className="w-5 h-5 -mr-4 rounded-full bg-[#0f171e] border-l border-[#2c3b4d]"></div>
      </div>

      {/* Ticket Footer with Barcode and Actions */}
      <div className="p-5 bg-[#151c24] space-y-4">
        {/* Mock QR and Barcode visual */}
        <div className="flex items-center justify-between gap-4">
          <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center flex-shrink-0 shadow">
            <QrCode className="w-14 h-14 text-black" />
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-10 w-full flex items-end justify-between gap-1 opacity-75">
              {[4, 2, 6, 8, 3, 5, 2, 7, 3, 6, 4, 8, 2, 5, 7, 3, 4, 6, 2, 8, 4, 3, 7, 5].map((h, i) => (
                <div
                  key={i}
                  className="bg-white"
                  style={{ height: `${h * 10}%`, width: `${i % 3 === 0 ? '4px' : '2px'}` }}
                ></div>
              ))}
            </div>
            <p className="text-[10px] font-mono text-center text-gray-500 mt-1 tracking-widest">
              SCAN AT SCREEN ENTRY GATE
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 print:hidden pt-2 border-t border-[#253241]">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#253241] hover:bg-[#2c3b4d] text-white text-xs font-semibold py-2 px-3 rounded-lg transition"
          >
            <Printer className="w-3.5 h-3.5 text-[#00a8e1]" />
            Print Pass
          </button>

          {!isCancelled && showCancel && onCancel && (
            <button
              onClick={() => onCancel(booking.bookingId)}
              className="flex items-center justify-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-800/40 text-xs font-semibold py-2 px-3 rounded-lg transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalTicket;
