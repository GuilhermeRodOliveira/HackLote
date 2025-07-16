'use client';

import BoostNotificationSettings from '@/components/BoostNotificationSettings/BoostNotificationSettings';
// ToastContainer já deve estar no app/layout.tsx, então não precisa importar aqui.

export default function BoostingSettingsPage() {
  return (
    // O div raiz aqui pode ser simples, pois o layout.tsx já gerencia o padding e fundo
    <div className="py-8"> {/* Adiciona um padding vertical para o conteúdo da página */}
      <BoostNotificationSettings />
    </div>
  );
}
