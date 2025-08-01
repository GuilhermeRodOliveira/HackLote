// src/app/booster/configuracoes/page.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '@/context/AuthContext'; // Importe seu AuthContext
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Importe o componente Image do Next.js

// Interface para as preferências de notificação do banco de dados
interface BoostPreference {
  id: string;
  userId: string;
  game: string;
  boostType: string;
}

// Dados de exemplo para jogos e tipos de boost
const AVAILABLE_BOOST_OPTIONS = [
  { game: 'Apex Legends', types: ['Rank Boost', 'Badge Boost', 'Win Boost'] },
  { game: 'Black Desert Online', types: ['Leveling Boost', 'Gear Score Boost', 'Silver Farm'] },
  { game: 'Brawl Stars', types: ['Rank Boost', 'Trophy Leveling Boost', 'Custom Request'] },
  { game: 'Call of Duty', types: ['Rank Boost', 'KD Boost', 'Camo Unlock'] },
  { game: 'Clash of Clans', types: ['Trophy Push', 'Resource Farming', 'War Attack'] },
  { game: 'Clash Royale', types: ['Trophy Push', 'Card Leveling', 'Tournament Win'] },
  { game: 'Counter-Strike 2', types: ['Rank Boost', 'Faceit Boost', 'Prime Status'] },
  { game: 'Dark and Darker', types: ['Dungeon Clear', 'Item Farm', 'Gold Farm'] },
  { game: 'Dead By Daylight', types: ['Rank Boost', 'Bloodpoint Farm', 'Character Leveling'] },
  { game: 'Deadlock', types: ['Rank Boost', 'Win Boost', 'Character Unlock'] },
  { game: 'Diablo 4', types: ['Leveling Boost', 'Dungeon Clear', 'Item Farm'] },
  { game: 'EA Sports FC 25', types: ['FUT Coins', 'Division Rivals Boost', 'Squad Battles Boost'] },
  { game: 'Elder Scrolls Online', types: ['Leveling Boost', 'Gold Farm', 'Dungeon Clear'] },
  { game: 'Escape from Tarkov', types: ['Raid Carry', 'Item Farm', 'Quest Completion'] },
  { game: 'Final Fantasy XIV', types: ['Leveling Boost', 'Raid Clear', 'Gil Farm'] },
  { game: 'Fortnite', types: ['Win Boost', 'Leveling Boost', 'V-Bucks Farm'] },
  { game: 'Genshin Impact', types: ['Account Leveling', 'Resource Farm', 'Abyss Clear'] },
  { game: 'League of Legends', types: ['Elo Job', 'Duo Boost', 'Placement Matches', 'Mastery Boost'] },
  { game: 'League of Legends: Wild Rift', types: ['Rank Boost', 'Placement Matches', 'Win Boost'] },
  { game: 'Marvel Rivals', types: ['Rank Boost', 'Character Leveling', 'Win Boost'] },
  { game: 'Mobile Legends', types: ['Rank Boost', 'Win Rate Boost', 'Hero Mastery'] },
  { game: 'Monster Hunter Wilds', types: ['Monster Hunt', 'Material Farm', 'Weapon Crafting'] },
  { game: 'New World', types: ['Leveling Boost', 'Gold Farm', 'Expedition Carry'] },
  { game: 'OSRS', types: ['Skill Leveling', 'Gold Farm', 'Quest Completion'] },
  { game: 'Overwatch 2', types: ['Rank Boost', 'Unranked to GM', 'Win Boost'] },
  { game: 'Path of Exile', types: ['Leveling Boost', 'Currency Farm', 'Boss Kill'] },
  { game: 'Pokemon Go', types: ['Leveling Boost', 'Rare Pokemon Catch', 'Gym Control'] },
  { game: 'Rainbow Six Siege X', types: ['Rank Boost', 'KD Boost', 'Win Boost'] },
  { game: 'Roblox', types: ['Game Specific Boost', 'Robux Farm', 'Item Trading'] },
  { game: 'Rocket League', types: ['Rank Boost', 'Tournament Boost', 'Item Farming'] },
  { game: 'Runescape 3', types: ['Skill Leveling', 'Gold Farm', 'Quest Completion'] },
  { game: 'Rust', types: ['Base Building', 'Resource Farm', 'Raid Assistance'] },
  { game: 'Teamfight Tactics', types: ['Rank Boost', 'Placement Matches', 'Hyper Roll Boost'] },
  { game: 'The First Descendant', types: ['Leveling Boost', 'Material Farm', 'Boss Kill'] },
  { game: 'Throne and Liberty', types: ['Leveling Boost', 'Gold Farm', 'Dungeon Clear'] },
  { game: 'Valorant', types: ['Rank Boost', 'Placement Matches', 'Win Boost'] },
  { game: 'Warframe', types: ['Mastery Rank Boost', 'Resource Farm', 'Prime Part Farm'] },
  { game: 'World of Warcraft', types: ['Leveling Boost', 'Gold Farm', 'Raid Carry'] },
  { game: 'World of Warcraft Mists of Pandaria', types: ['Leveling Boost', 'Gold Farm', 'Raid Carry'] },
  { game: 'WoW Classic', types: ['Leveling Boost', 'Gold Farm', 'Raid Carry'] },
];

// Mapeamento de jogos para números de ícones (AGORA COM AS CORRESPONDÊNCIAS EXATAS FORNECIDAS)
const GAME_ICON_MAP: Record<string, string> = {
  'Apex Legends': '33',
  'Black Desert Online': '24',
  'Brawl Stars': '56',
  'Call of Duty': '35',
  'Clash of Clans': '18',
  'Clash Royale': '52',
  'Counter-Strike 2': '20',
  'Dark and Darker': '128',
  'Dead By Daylight': '47',
  'Deadlock': '214',
  'Diablo 4': '132',
  'EA Sports FC 25': '142',
  'Elder Scrolls Online': '3',
  'Escape from Tarkov': '19',
  'Final Fantasy XIV': '7',
  'Fortnite': '16',
  'Genshin Impact': '39',
  'League of Legends': '17',
  'League of Legends: Wild Rift': '53',
  'Marvel Rivals': '227',
  'Mobile Legends': '55',
  'Monster Hunter Wilds': '234',
  'New World': '36',
  'OSRS': '10',
  'Overwatch 2': '27',
  'Path of Exile': '2',
  'Pokemon Go': '57',
  'Rainbow Six Siege X': '48',
  'Roblox': '70',
  'Rocket League': '1',
  'Runescape 3': '9',
  'Rust': '37',
  'Teamfight Tactics': '198',
  'The First Descendant': '210',
  'Throne and Liberty': '171',
  'Valorant': '32',
  'Warframe': '11',
  'World of Warcraft': '0',
  'World of Warcraft Mists of Pandaria': '14',
  'WoW Classic': '92',
};

// URL base para os ícones
const ICON_BASE_URL = 'https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v21/';

export default function BoosterNotificationSettingsPage() { // Renomeado para refletir que é uma página
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  // Estado para armazenar as preferências do usuário (mapa para fácil acesso)
  // Key: `${game}-${boostType}`, Value: boolean (true se inscrito)
  const [userPreferences, setUserPreferences] = useState<Record<string, boolean>>({});
  // Estado para controlar qual jogo está expandido/aberto
  const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Novo estado para indicar salvamento

  // Função para simular o salvamento das preferências no backend
  const savePreferencesToBackend = async (preferences: Record<string, boolean>) => {
    setIsSaving(true);
    try {
      // Converte o mapa de preferências de volta para o formato esperado pela API
      const preferencesToSend = AVAILABLE_BOOST_OPTIONS.flatMap(gameOption =>
        gameOption.types.map(type => ({
          game: gameOption.game,
          boostType: type,
          subscribed: preferences[`${gameOption.game}-${type}`] || false,
        }))
      );

      // Aqui você faria a chamada REAL para a API para salvar as preferências
      // Exemplo:
      // const res = await fetch('/api/boost-preferences', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ preferences: preferencesToSend }),
      // });
      // const data = await res.json();

      // Simulação de delay da API
      await new Promise(resolve => setTimeout(resolve, 800));

      // if (res.ok) {
        toast.success('Preferências de Boost salvas automaticamente!');
        console.log('Preferências de Boost salvas automaticamente:', preferencesToSend);
      // } else {
      //   toast.error(data.error || 'Erro ao salvar preferências automaticamente.');
      // }
    } catch (error) {
      console.error('Erro de rede ao salvar preferências automaticamente:', error);
      toast.error('Erro de rede. Não foi possível salvar as preferências.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchPreferences = async () => {
      if (authLoading) return; // Espera a autenticação carregar

      if (!user) {
        toast.error('Você precisa estar logado para gerenciar preferências de boost.');
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/boost-preferences');
        const data = await res.json();

        if (res.ok) {
          const fetchedPreferences: BoostPreference[] = data.preferences;
          const mappedPreferences: Record<string, boolean> = {};
          fetchedPreferences.forEach(pref => {
            mappedPreferences[`${pref.game}-${pref.boostType}`] = true;
          });
          setUserPreferences(mappedPreferences);
        } else {
          toast.error(data.error || 'Erro ao carregar preferências.');
        }
      } catch (error) {
        console.error('Erro de rede ao buscar preferências:', error);
        toast.error('Erro de rede ao carregar preferências.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user, authLoading, router]); // Dependências

  // Efeito para salvar automaticamente as configurações quando userPreferences mudam
  useEffect(() => {
    // Evita o salvamento inicial quando o componente é montado
    // ou quando os estados são inicializados pela primeira vez.
    // Você pode adicionar uma flag para controlar isso se precisar carregar do backend.
    
    // Verifica se o componente terminou de carregar as preferências iniciais
    if (isLoading) return; 

    const handler = setTimeout(() => {
      savePreferencesToBackend(userPreferences);
    }, 500); // Debounce de 500ms para evitar muitas chamadas à API

    // Limpa o timeout se os estados mudarem novamente antes do tempo
    return () => {
      clearTimeout(handler);
    };
  }, [userPreferences, isLoading]); // Dependências: salva quando userPreferences muda

  // Função para lidar com a mudança do toggle de preferência
  const handleToggleChange = (game: string, boostType: string, isChecked: boolean) => {
    setUserPreferences(prev => ({
      ...prev,
      [`${game}-${boostType}`]: isChecked,
    }));
  };

  // Função para alternar a expansão de um jogo
  const toggleGameExpansion = (game: string) => {
    setExpandedGames(prev => ({
      ...prev,
      [game]: !prev[game],
    }));
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Carregando configurações de notificação...</p>
      </div>
    );
  }

  if (!user) {
    return null; // O useEffect já redireciona se não houver usuário
  }

  return (
    // ALTERADO: Aplicando max-w-3xl mx-auto e padding diretamente ao div raiz do componente
    <div className="max-w-3xl mx-auto py-4 px-4 sm:px-8 min-h-[calc(100vh-80px)] bg-[#0f0f1a] text-white">
      <h1 className="text-3xl font-bold text-white mb-6">Configurações de Notificação de Boost</h1>
      <p className="text-gray-400 mb-8">
        Selecione os jogos e tipos de serviço para os quais você deseja receber notificações de novos pedidos de boost.
      </p>

      {/* Contêiner principal para a lista de jogos - Estilo Eldorado.gg */}
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden">
        {AVAILABLE_BOOST_OPTIONS.map(gameOption => {
          // Calcula quantos tipos de boost estão inscritos para este jogo
          const subscribedCount = gameOption.types.filter(type => userPreferences[`${gameOption.game}-${type}`]).length;
          const totalTypes = gameOption.types.length;
          const subscriptionStatus = subscribedCount > 0
            ? `Subscribed ${subscribedCount}/${totalTypes}`
            : 'Not subscribed';

          const iconNumber = GAME_ICON_MAP[gameOption.game];
          const iconUrl = iconNumber ? `${ICON_BASE_URL}${iconNumber}.png?w=28` : 'https://placehold.co/28x28/4B5563/FFFFFF?text=?'; // Fallback icon

          return (
            // Item individual do jogo - Estilo Eldorado.gg
            <div key={gameOption.game} className="bg-[#242424] border-b border-gray-800 last:border-b-0">
              <div
                className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-[#2c2c2c] transition-colors duration-200"
                onClick={() => toggleGameExpansion(gameOption.game)}
              >
                <div className="flex items-center gap-4 flex-grow">
                  {/* Ícone do jogo */}
                  <Image
                    src={iconUrl}
                    alt={`${gameOption.game} icon`}
                    width={28}
                    height={28}
                    className="rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/28x28/4B5563/FFFFFF?text=?';
                    }}
                  />
                  <h2 className="text-base font-semibold text-white whitespace-nowrap">{gameOption.game}</h2>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-sm ${subscribedCount > 0 ? 'text-green-400' : 'text-gray-400'} whitespace-nowrap`}>
                    {subscriptionStatus}
                  </span>
                  <span className="material-symbols-outlined text-gray-400 text-xl">
                    {expandedGames[gameOption.game] ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </div>

              {/* Submenu de tipos de boost, visível apenas se o jogo estiver expandido */}
              {expandedGames[gameOption.game] && (
                <div className="px-8 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gameOption.types.map(boostType => (
                      <div key={`${gameOption.game}-${boostType}`} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                        <span className="text-gray-200 text-sm">{boostType}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            value=""
                            className="sr-only peer"
                            checked={userPreferences[`${gameOption.game}-${boostType}`] || false}
                            onChange={(e) => handleToggleChange(gameOption.game, boostType, e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {isSaving && (
        <p className="text-center text-yellow-400 text-sm mt-4">
          Salvando automaticamente...
        </p>
      )}
    </div>
  );
}
