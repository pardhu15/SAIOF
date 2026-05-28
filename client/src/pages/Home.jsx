import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

/**
 * SAIOF Homepage Catalog Interface
 * Manages product fetches, text search indexing, categories, sorting filters, and pagination.
 */
const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [addingCartMap, setAddingCartMap] = useState({});

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Debounce search input to limit API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch products catalog from API
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 6, // 6 items per page fits grid nicely
        search: debouncedSearch,
        category,
        sort
      };

      const res = await apiClient.get('/products', { params });
      if (res.data && res.data.success) {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('[Catalog Fetch Error] Failed:', err);
      setError(err.response?.data?.message || 'Could not fetch catalog products. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, category, sort, page]);

  // Add Item to Cart API Trigger
  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      // Redirect to login if user is unauthenticated
      alert('Authentication required to manage shopping cart. Redirecting...');
      navigate('/login');
      return;
    }

    setAddingCartMap((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await apiClient.post('/cart/add', { productId, quantity: 1 });
      if (res.data && res.data.success) {
        alert('Product added to your cart successfully!');
      }
    } catch (err) {
      console.error('[Cart Add Error] Failed:', err);
      alert(err.response?.data?.message || 'Failed to add item to cart');
    } finally {
      setAddingCartMap((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Page Title */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Discover Premium Products
        </h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base">
          Shop the latest collections with seamless browsing and secure checkout.
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-800/60 shadow-lg">
        {/* Search */}
        <SearchBar value={search} onChange={setSearch} placeholder="Search products by title..." />

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Books">Books</option>
            <option value="Accessories">Accessories</option>
            <option value="Gadgets">Gadgets</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none cursor-pointer"
          >
            <option value="">Sort: Newest</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-ratings">Rating: High to Low</option>
          </select>
        </div>
      </div>

      {/* Catalog Render Workspace */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : products.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center border border-gray-800/80">
          <span className="text-5xl block mb-4">🔍</span>
          <h3 className="text-xl font-bold text-white mb-2">
            {category ? 'No products found for this category.' : 'No Products Found'}
          </h3>
          <p className="text-sm text-gray-400">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
                isAdding={!!addingCartMap[product._id]}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-12">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 border border-gray-800 text-gray-300 text-sm font-semibold rounded-xl transition-all duration-300"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-gray-400 px-4">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
                disabled={page === pagination.pages}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 border border-gray-800 text-gray-300 text-sm font-semibold rounded-xl transition-all duration-300"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
