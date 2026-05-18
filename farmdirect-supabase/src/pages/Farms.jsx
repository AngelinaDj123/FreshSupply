import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { suppliersAPI } from '../lib/supabase';
import { Spinner, EmptyState } from '../components/ui';
import { Search, MapPin, Clock, Star, ShieldCheck, Zap, Building2 } from 'lucide-react';

const EMIRATES = ['All UAE','Dubai','Abu Dhabi','Al Ain','Sharjah','RAK','Fujairah','Ajman'];
const CATEGORIES = ['All','greens','vegetables','dairy','herbs','seafood','eggs','fruits','meat'];

export default function Farms() {
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emirate, setEmirate] = useState('All UAE');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    suppliersAPI.list({ search: search || undefined, category: category === 'All' ? undefined : category })
      .then(data => {
        const filtered = emirate === 'All UAE' ? data : data.filter(f => f.city?.toLowerCase().includes(emirate.toLowerCase()));
        setFarms(filtered);
      })
      .finally(() => setLoading(false));
  }, [search, category, emirate]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-green-500 bg-gray-50"
            placeholder="Search UAE farms..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="px-5 py-2.5 border-b border-gray-100 bg-white flex gap-2 overflow-x-auto scrollbar-hide">
        {EMIRATES.map(e => (
          <button key={e} onClick={() => setEmirate(e)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${
              emirate === e ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:border-green-300'
            }`}>
            {e !== 'All UAE' && <MapPin className="w-2.5 h-2.5" />}{e}
          </button>
        ))}
      </div>
      <div className="px-5 py-2 border-b border-gray-100 bg-white flex gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors capitalize ${
              category === c ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}>{c}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-800">{emirate === 'All UAE' ? 'All verified UAE farms' : `Farms in ${emirate}`}</p>
          <p className="text-xs text-gray-400">{farms.length} farms</p>
        </div>
        {loading ? <Spinner /> : (
          <div className="grid grid-cols-2 gap-3">
            {farms.length === 0 && <div className="col-span-2"><EmptyState icon={Building2} title="No farms found" description="Try adjusting your filters" /></div>}
            {farms.map(farm => (
              <div key={farm.id} onClick={() => navigate(`/farms/${farm.id}`)}
                className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-green-200 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-xl flex-shrink-0">
                    {farm.emoji || '🌿'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 truncate">{farm.name}</p>
                      {farm.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <MapPin className="w-3 h-3" />{farm.city || 'UAE'}
                    </div>
                  </div>
                </div>
                {farm.certifications?.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {farm.certifications.slice(0, 3).map(c => (
                      <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize border border-gray-200">{c}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-amber-500">
                    <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                    <span className="font-medium">{farm.rating || '—'}</span>
                    <span className="text-gray-400">({farm.total_orders || 0})</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />{farm.lead_time_hours || '?'}h
                  </div>
                  {farm.accepts_urgent && (
                    <div className="flex items-center gap-0.5 text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                      <Zap className="w-2.5 h-2.5" /> Urgent
                    </div>
                  )}
                </div>
                <button className="mt-3 w-full py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                  Browse products →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
