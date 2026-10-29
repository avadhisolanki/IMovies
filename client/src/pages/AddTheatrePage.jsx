import React, { useState, useEffect } from 'react';
import { Building2, Plus, Trash2, ArrowLeft, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const AddTheatrePage = () => {
  const [theatreName, setTheatreName] = useState('');
  const [location, setLocation] = useState('');
  const [balconySeatPrice, setBalconySeatPrice] = useState(400);
  const [middleSeatPrice, setMiddleSeatPrice] = useState(260);
  const [lowerSeatPrice, setLowerSeatPrice] = useState(160);

  const [theatres, setTheatres] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchTheatres = async () => {
    try {
      const res = await api.get('/theatre');
      if (res.data && res.data.theatres) {
        setTheatres(res.data.theatres);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!theatreName || !location) {
      toast.warning('Please enter theatre name and location');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/theatre', {
        theatreName,
        location,
        balconySeatPrice: Number(balconySeatPrice),
        middleSeatPrice: Number(middleSeatPrice),
        lowerSeatPrice: Number(lowerSeatPrice),
        balconySeats: { rows: 2, cols: 10, prefix: 'B' },
        middleSeats: { rows: 3, cols: 10, prefix: 'M' },
        lowerSeats: { rows: 2, cols: 10, prefix: 'L' },
        amenities: ['IMAX Laser 3D', 'Dolby Atmos 7.1', 'Plush Recliners', 'Gourmet Lounge'],
      });

      if (res.data && res.data.success) {
        toast.success('Theatre added successfully!');
        setTheatreName('');
        setLocation('');
        fetchTheatres();
      }
    } catch (err) {
      toast.error('Failed to create theatre');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this theatre venue?')) return;
    try {
      await api.delete(`/theatre/${id}`);
      toast.info('Theatre deleted');
      fetchTheatres();
    } catch (err) {
      toast.error('Failed to delete theatre');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex items-center gap-4 border-b border-[#253241] pb-6">
          <Link
            to="/admin"
            className="p-2 rounded-lg bg-[#1a242f] hover:bg-[#253241] text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              VENUE ARCHITECTURE
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Add Theatre Venue & Tier Pricing</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-[#1a242f] rounded-2xl border border-[#2c3b4d] p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Multiplex Configuration
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Theatre Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={theatreName}
                    onChange={(e) => setTheatreName(e.target.value)}
                    placeholder="e.g. PVR Prime IMAX, Phoenix Palladium"
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Location / City Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lower Parel, Mumbai"
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>
              </div>

              {/* Tier Pricing Configuration */}
              <div className="p-4 bg-[#151c24] rounded-xl border border-[#253241] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#00a8e1]">
                  Tier Pricing Structure (₹ INR)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-sky-400 block mb-1 font-semibold">
                      Balcony Club Price (A-B)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={balconySeatPrice}
                      onChange={(e) => setBalconySeatPrice(e.target.value)}
                      className="w-full bg-[#1a242f] text-white text-xs p-2.5 rounded-lg border border-sky-500/40 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-purple-400 block mb-1 font-semibold">
                      Middle Prime Price (C-E)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={middleSeatPrice}
                      onChange={(e) => setMiddleSeatPrice(e.target.value)}
                      className="w-full bg-[#1a242f] text-white text-xs p-2.5 rounded-lg border border-purple-500/40 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-emerald-400 block mb-1 font-semibold">
                      Lower Saver Price (F-G)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={lowerSeatPrice}
                      onChange={(e) => setLowerSeatPrice(e.target.value)}
                      className="w-full bg-[#1a242f] text-white text-xs p-2.5 rounded-lg border border-emerald-500/40 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-extrabold text-sm py-3 rounded-xl transition shadow-lg mt-4"
              >
                <Plus className="w-4 h-4" />
                Register Venue Screen
              </button>
            </form>
          </div>

          {/* List of Theatres */}
          <div className="bg-[#1a242f] rounded-2xl border border-[#2c3b4d] p-6 shadow-xl h-fit">
            <h2 className="text-base font-bold text-white mb-4">
              Registered Theatres ({theatres.length})
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {theatres.map((th) => (
                <div
                  key={th._id}
                  className="p-3.5 bg-[#151c24] rounded-xl border border-[#253241] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white">{th.theatreName}</h4>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#00a8e1]" />
                        {th.location}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(th._id)}
                      className="p-1 text-red-400 hover:text-red-300 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-gray-300 border-t border-[#253241] pt-2">
                    <span className="text-sky-400 font-bold">B: ₹{th.balconySeatPrice}</span>
                    <span>•</span>
                    <span className="text-purple-400 font-bold">M: ₹{th.middleSeatPrice}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">L: ₹{th.lowerSeatPrice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AddTheatrePage;
