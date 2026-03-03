import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './css/App.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShopProvider } from './context/ShopContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Spinner from './components/Spinner';
import ScrollToTop from './components/ScrollToTop';

const ProductList = lazy(() => import('./components/ProductList'));
const Product = lazy(() => import('./components/Product'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Favorites = lazy(() => import('./components/Favorites'));
const Checkout = lazy(() => import('./components/Checkout'));
const HeroSlider = lazy(() => import('./components/HeroSlider'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: true,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ShopProvider>
        <Router>
          <ScrollToTop />
          <div className="App">
            <Navbar />

            <main className="app-main">
              <Suspense fallback={<Spinner fullPage={true} text="Sayfa yükleniyor..." />}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <React.Fragment>
                        <HeroSlider />
                        <ProductList />
                      </React.Fragment>
                    }
                  />
                  <Route path="/category/:categoryName" element={<ProductList />} />
                  <Route path="/product/:id" element={<Product />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/checkout" element={<Checkout />} />
                </Routes>
              </Suspense>
            </main>

            <Footer />

            <ToastContainer position="top-left" autoClose={2000} theme="light" />
          </div>
        </Router>
      </ShopProvider>
    </QueryClientProvider>
  );
}

export default App;
