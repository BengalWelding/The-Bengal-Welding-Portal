import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, User } from '../types';
import { BUSINESS_EMAIL, BUSINESS_PHONE } from '../constants';
import { listProducts } from '../lib/products';

interface ProductsCatalogProps {
  user?: User | null;
}

function formatProductPrice(product: Product): string {
  if (product.name === 'Tandoori Oven') {
    return '£1000+';
  }
  const min = product.price_min ?? product.price;
  return `£${min.toLocaleString()}+`;
}

const ProductsCatalog: React.FC<ProductsCatalogProps> = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await listProducts();
        setProducts(data);
      } catch (e) {
        setProducts([]);
        setLoadError(e instanceof Error ? e.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categories = React.useMemo(
    () => ['All', ...new Set(products.map((p) => p.category))],
    [products]
  );
  const filteredProducts = React.useMemo(() => {
    return selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const getQuoteEmailLink = (product: Product) =>
    `mailto:${BUSINESS_EMAIL}?subject=${encodeURIComponent(`Quote request – ${product.name}`)}`;

  const getQuotePhoneLink = () => `tel:${BUSINESS_PHONE.replace(/\s/g, '')}`;

  const handleRequestService = () => {
    navigate('/dashboard?openRequestForm=1');
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#F2C200]">Equipment & Services</h1>
        <p className="text-white opacity-80">Professional commercial kitchen solutions. Contact us for a quote.</p>
      </header>

      {loading ? (
        <div className="bg-[#111111] border border-[#333333] p-8 rounded-2xl text-center text-gray-400 font-bold">
          Loading products...
        </div>
      ) : loadError ? (
        <div className="bg-[#111111] border border-red-800/50 p-8 rounded-2xl text-center text-red-400 font-bold">
          {loadError}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-[#111111] border border-[#333333] p-8 rounded-2xl text-center text-gray-500 font-bold">
          No products available yet.
        </div>
      ) : null}

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
              selectedCategory === cat
                ? `bg-[#F2C200] text-black border-[#F2C200]`
                : 'bg-black text-gray-500 border-[#333333] hover:border-[#F2C200]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-[#111111] rounded-2xl border border-[#333333] shadow-lg overflow-hidden group flex flex-col hover:border-[#F2C200] transition-colors">
            <div className="h-64 overflow-hidden relative bg-black flex items-center justify-center border-b border-[#333333]">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fallbackApplied === '1') return;
                  img.dataset.fallbackApplied = '1';
                  img.src = '/test-crop.png';
                }}
              />
              <span className="absolute top-3 right-3 bg-[#F2C200] px-2 py-1 rounded-md text-[10px] font-black text-black shadow-lg uppercase tracking-wide">
                {product.category}
              </span>
            </div>
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="font-bold text-lg text-white mb-1">{product.name}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{product.description}</p>
              
              <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-[#333333]">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-[#F2C200]">
                    {product.category === 'Services' ? 'From ' : ''}{formatProductPrice(product)}
                    {product.name === 'Grease Cleaning Service Plan' && <span className="text-sm font-normal text-gray-400">/mo</span>}
                  </span>
                  <div className="flex gap-2">
                    {product.name === 'Grease Cleaning Service Plan' ? (
                      <button 
                        onClick={handleRequestService}
                        className="bg-[#F2C200] text-black px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all"
                      >
                        Request a Service
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <a
                          href={getQuoteEmailLink(product)}
                          className="bg-[#F2C200] text-black px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all inline-flex items-center gap-1"
                        >
                          <i className="fas fa-envelope text-xs"></i>
                          Email
                        </a>
                        <a
                          href={getQuotePhoneLink()}
                          className="bg-[#111111] border border-[#333333] text-[#F2C200] px-4 py-2 rounded-lg text-sm font-bold hover:border-[#F2C200] transition-all inline-flex items-center gap-1"
                        >
                          <i className="fas fa-phone text-xs"></i>
                          Call
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#111111] border border-[#333333] p-6 rounded-2xl flex items-start space-x-4">
        <div className="bg-black border border-[#F2C20033] p-3 rounded-xl text-[#F2C200] shadow-sm">
          <i className="fas fa-tools text-xl"></i>
        </div>
        <div>
          <h4 className="font-bold text-[#F2C200] uppercase tracking-tight">Custom Fabrication?</h4>
          <p className="text-sm text-gray-400 mt-1">
            We specialize in bespoke stainless steel tables and extraction units.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href={`mailto:${BUSINESS_EMAIL}`}
              className="bg-[#F2C200] text-black px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all inline-flex items-center gap-1"
            >
              <i className="fas fa-envelope text-xs"></i>
              Email engineering team
            </a>
            <a
              href={getQuotePhoneLink()}
              className="bg-[#111111] border border-[#333333] text-[#F2C200] px-4 py-2 rounded-lg text-sm font-bold hover:border-[#F2C200] transition-all inline-flex items-center gap-1"
            >
              <i className="fas fa-phone text-xs"></i>
              Call the team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsCatalog;