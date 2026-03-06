import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './css/App.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShopProvider } from './context/ShopContext';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Spinner from './components/Spinner';
import ScrollToTop from './components/ScrollToTop';

import ProtectedRoute from './components/ProtectedRoute';

const ProductList = lazy(() => import('./components/ProductList'));
const Product = lazy(() => import('./components/Product'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Favorites = lazy(() => import('./components/Favorites'));
const Checkout = lazy(() => import('./components/Checkout'));
const HeroSlider = lazy(() => import('./components/HeroSlider'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

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
      <AuthProvider>
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
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <AdminPanel />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/favorites"
                      element={
                        <ProtectedRoute>
                          <Favorites />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                  </Routes>
                </Suspense>
              </main>

              <Footer />

              <ToastContainer position="top-left" autoClose={2000} theme="light" />
            </div>
          </Router>
        </ShopProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
