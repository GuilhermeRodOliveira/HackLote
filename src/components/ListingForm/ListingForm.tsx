// src/components/ListingForm/ListingForm.tsx
'use client';

import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import Image from 'next/image';
import { X } from 'lucide-react';

const gameLogos: { [key: string]: string } = {
  'Valorant': '/img/valorant.png',
  'League of Legends': '/img/lol.png',
  'GTA V': '/img/gta.png',
  'CS2': '/img/cs2.png',
  'Fortnite': '/img/fortnite.png',
  'Rainbow Six': '/img/r6.png',
  'Rocket League': '/img/rocketleague.png',
};

export default function ListingForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    game: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); 
  const [previewImageUrls, setPreviewImageUrls] = useState<string[]>([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0); 

  const supportedGames = [
    'Valorant',
    'League of Legends',
    'GTA V',
    'CS2',
    'Fortnite',
    'Rainbow Six',
    'Rocket League',
  ];

  const listingCategories = ['Contas', 'Skins', 'Gift Cards', 'Itens'];

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Você precisa estar logado para criar uma listagem.');
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const urls: string[] = [];
    if (selectedFiles.length > 0) {
      selectedFiles.forEach(file => urls.push(URL.createObjectURL(file)));
    } else if (formData.game && gameLogos[formData.game]) {
      urls.push(gameLogos[formData.game]);
    }
    setPreviewImageUrls(urls);

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles, formData.game]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'game' && selectedFiles.length === 0) {
      setPreviewImageUrls(gameLogos[value] ? [gameLogos[value]] : []);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newFiles = filesArray.slice(0, 4);
      setSelectedFiles(newFiles);
      setMainImageIndex(0);
    } else {
      setSelectedFiles([]);
      setMainImageIndex(0);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prevFiles => {
      const updatedFiles = prevFiles.filter((_, index) => index !== indexToRemove);
      if (mainImageIndex === indexToRemove && updatedFiles.length > 0) {
        setMainImageIndex(0);
      } else if (mainImageIndex > indexToRemove) {
        setMainImageIndex(prevIndex => prevIndex - 1);
      } else if (updatedFiles.length === 0) {
        setMainImageIndex(0);
      }
      return updatedFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Você precisa estar logado para criar uma listagem.');
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    toast.loading('Criando listagem...');

    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.game) {
      toast.dismiss();
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      setIsSubmitting(false);
      return;
    }

    const hasImagesSelected = selectedFiles.length > 0;
    const hasGameLogoFallback = formData.game && gameLogos[formData.game];

    if (!hasImagesSelected && !hasGameLogoFallback) {
      toast.dismiss();
      toast.error('Por favor, selecione pelo menos uma imagem ou escolha um jogo com logo disponível.');
      setIsSubmitting(false);
      return;
    }

    const dataToSend = new FormData();
    dataToSend.append('title', formData.title);
    dataToSend.append('description', formData.description);
    dataToSend.append('price', parseFloat(formData.price).toString());
    dataToSend.append('category', formData.category);
    dataToSend.append('game', formData.game);

    if (hasImagesSelected) {
      const filesToSend = [...selectedFiles];
      if (mainImageIndex > 0) {
        const [mainFile] = filesToSend.splice(mainImageIndex, 1);
        filesToSend.unshift(mainFile); // Coloca a imagem principal no início
      }
      filesToSend.forEach((file, index) => {
        dataToSend.append(`images[${index}]`, file); // Envia como array de arquivos
      });
    } else if (hasGameLogoFallback) {
      dataToSend.append('gameLogoUrl', gameLogos[formData.game]);
    }

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        body: dataToSend, 
      });

      if (res.ok) {
        const result = await res.json();
        toast.dismiss();
        toast.success(result.message || 'Listagem criada com sucesso!');
        router.push('/marketplace');
      } else {
        const errorData = await res.json();
        toast.dismiss();
        toast.error(errorData.error || 'Falha ao criar listagem.');
      }
    } catch (error) {
      console.error('Erro de rede ao criar listagem:', error);
      toast.dismiss();
      toast.error('Erro de conexão ao criar listagem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="text-textSecondary text-center py-8">Carregando autenticação...</div>;
  }
  if (!user) {
    router.push('/login');
    return (
        <div className="text-textSecondary text-center py-8">Você precisa estar logado para criar uma listagem. Redirecionando...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-backgroundSecondary rounded-lg p-8 shadow-lg"> {/* Aumentado para max-w-3xl */}
      <h1 className="text-3xl font-bold mb-8 text-accent1 text-center">Criar Nova Listagem</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título da Listagem */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-textSecondary">Título</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md shadow-sm sm:text-sm p-2
                       bg-backgroundPrimary border border-borderColor text-textPrimary focus:border-textPrimary focus:ring-1 focus:ring-textPrimary focus:ring-offset-0"
          />
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-textSecondary">Descrição</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md shadow-sm sm:text-sm p-2
                       bg-backgroundPrimary border border-borderColor text-textPrimary focus:border-textPrimary focus:ring-1 focus:ring-textPrimary focus:ring-offset-0"
          ></textarea>
        </div>

        {/* Agrupamento de Preço, Categoria e Jogo em Grid de 3 Colunas para telas md e maiores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Adicionado Grid para 3 colunas */}
          {/* Preço */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-textSecondary">Preço (R$)</label>
            <div className="mt-1 flex rounded-md shadow-sm 
                         focus-within:ring-1 focus-within:ring-textPrimary focus-within:ring-offset-0 focus-within:border-textPrimary">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-borderColor
                               bg-backgroundPrimary text-textPrimary text-sm">
                R$
              </span>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                className="flex-1 block w-full rounded-r-md sm:text-sm p-2
                           bg-backgroundPrimary border-t border-b border-r border-borderColor text-textPrimary focus:border-transparent focus:ring-0 focus:outline-none"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-textSecondary">Categoria</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md shadow-sm sm:text-sm p-2 appearance-none
                         bg-backgroundPrimary border border-borderColor text-textPrimary focus:border-textPrimary focus:ring-1 focus:ring-textPrimary focus:ring-offset-0"
            >
              <option value="">Selecione uma categoria...</option>
              {listingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Campo Jogo */}
          <div>
            <label htmlFor="game" className="block text-sm font-medium text-textSecondary">Jogo</label>
            <select
              id="game"
              name="game"
              value={formData.game}
              onChange={handleChange}
              required
              // flex-shrink-0 impede o encolhimento
              className="mt-1 block w-full rounded-md shadow-sm sm:text-sm p-2 appearance-none
                         bg-backgroundPrimary border border-borderColor text-textPrimary focus:border-textPrimary focus:ring-1 focus:ring-textPrimary focus:ring-offset-0
                         flex-shrink-0"
            >
              <option value="">Selecione o jogo...</option>
              {supportedGames.map((gameOption) => (
                <option key={gameOption} value={gameOption}>
                  {gameOption}
                </option>
              ))}
            </select>
          </div>
        </div> {/* Fim do Grid de 3 Colunas */}

        {/* Campo de Upload de Imagem e Pré-visualização Múltipla */}
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-textSecondary">Imagens da Listagem (Máx. 4, Opcional)</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            multiple // Permite múltiplos arquivos
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0 file:text-sm file:font-semibold file:cursor-pointer
                       file:bg-accent1 file:text-backgroundPrimary hover:file:bg-accent1-shade
                       text-textPrimary"
          />
          {/* Mensagem de fallback ou arquivo selecionado */}
          {selectedFiles.length > 0 ? (
              <p className="mt-2 text-sm text-textSecondary text-center">
                  {selectedFiles.length} arquivo(s) selecionado(s).
              </p>
          ) : (formData.game && gameLogos[formData.game]) ? (
              <p className="mt-2 text-sm text-textSecondary text-center">
                  Caso não envie fotos, será usado o logo de {formData.game}.
              </p>
          ) : (
              <p className="mt-2 text-sm text-textSecondary text-center">
                  Nenhuma imagem selecionada. Selecione um jogo para usar seu logo.
              </p>
          )}

          {/* Pré-visualização de Imagens Múltiplas / Logo do Jogo */}
          {previewImageUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previewImageUrls.map((url, index) => (
                <div key={url} className={`relative w-full h-24 border rounded-md overflow-hidden 
                                     ${mainImageIndex === index ? 'border-accent1 ring-2 ring-accent1' : 'border-borderColor'}`}>
                  <Image
                    src={url}
                    alt={`Pré-visualização ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md"
                  />
                  {/* Botão de Remover Imagem */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs leading-none"
                    aria-label="Remover imagem"
                  >
                    <X size={14} />
                  </button>
                  {/* Botão para definir como imagem principal */}
                  <input
                    type="radio"
                    name="mainImage"
                    id={`mainImage-${index}`}
                    checked={mainImageIndex === index}
                    onChange={() => setMainImageIndex(index)}
                    className="absolute bottom-1 left-1 z-10"
                    aria-label={`Definir como imagem principal ${index + 1}`}
                  />
                  <label 
                    htmlFor={`mainImage-${index}`} 
                    className="absolute bottom-1 left-6 text-xs text-white bg-black bg-opacity-50 px-1 rounded cursor-pointer z-0"
                  >
                    Principal
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão de Criação */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed
                       bg-accent1 hover:bg-accent1-shade text-backgroundPrimary focus:outline-none focus:ring-2 focus:ring-textPrimary focus:ring-offset-0"
          >
            {isSubmitting ? 'Criando...' : 'Criar Listagem'}
          </button>
        </div>
      </form>
    </div>
  );
}