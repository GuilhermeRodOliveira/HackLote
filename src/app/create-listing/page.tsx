// app/create-listing/page.tsx
'use client'; // Necessário se este for um Client Component

import ListingForm from '@/components/ListingForm/ListingForm';
import { ToastContainer } from 'react-toastify'; // Importe ToastContainer aqui também
import 'react-toastify/dist/ReactToastify.css';

export default function CreateListingPage() {
  return (
    <>
      <ListingForm />
      <ToastContainer /> {/* Adicione o ToastContainer na sua página raiz ou layout */}
    </>
  );
}