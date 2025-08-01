// src/components/settings/ProfileSettings/ProfileSettings.tsx
'use client';

import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// ATUALIZADO: Incluir os novos campos do backend
interface UserProfileSettings {
  nome?: string | null;
  usuario?: string | null;
  email: string;
  bio?: string | null;
  profilePictureUrl?: string | null;
  country?: string | null;
  hasChangedUsername?: boolean | null; // Novo campo
  usernameLastChangedAt?: string | null; // Novo campo (string porque vem do backend)
}

const DEFAULT_PROFILE_PICTURE = '/img/avatar.png'; // Certifique-se que este caminho está correto para seu arquivo

export default function ProfileSettings() {
  const { user, loading: authLoading, refreshUser } = useContext(AuthContext);
  const router = useRouter();
  const [formData, setFormData] = useState<UserProfileSettings>({
    nome: '',
    usuario: '',
    email: '',
    bio: '',
    profilePictureUrl: DEFAULT_PROFILE_PICTURE,
    country: '',
    hasChangedUsername: false, // Default para o frontend
    usernameLastChangedAt: null, // Default para o frontend
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NOVOS ESTADOS PARA O FLUXO DE ALTERAÇÃO DE USUÁRIO
  const [newUsername, setNewUsername] = useState('');
  const [confirmNewUsername, setConfirmNewUsername] = useState('');
  const [isChangingUsernameFlow, setIsChangingUsernameFlow] = useState(false); // Ativa quando o usuário clica "Alterar" e confirma o aviso
  const [showUsernameWarning, setShowUsernameWarning] = useState(false); // Ativa o pop-up de aviso inicial
  const [usernameError, setUsernameError] = useState(''); // Mensagem de erro para validação do username no frontend

  // Função para formatar a data/hora
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nunca';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) { // Verifica se a data é inválida
        return 'Data inválida';
      }
      return date.toLocaleString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return 'Data inválida';
    }
  };

  // MOVIDO PARA FORA DO useEffect para ser acessível globalmente no componente
  // ATENÇÃO: Se esta função precisar de valores de estado que mudam,
  // você pode passá-los como argumentos ou incluí-los nas dependências de useCallback
  // se quiser memoizá-la. Para este caso simples, é ok assim.
  const fetchUserSettingsFromAPI = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/settings`);

      if (res.ok) {
        const data: UserProfileSettings = await res.json();
        setFormData({
          nome: data.nome || '',
          usuario: data.usuario || '',
          email: data.email || '',
          bio: data.bio || '',
          profilePictureUrl: data.profilePictureUrl || DEFAULT_PROFILE_PICTURE,
          country: data.country || '',
          hasChangedUsername: data.hasChangedUsername || false,
          usernameLastChangedAt: data.usernameLastChangedAt || null,
        });
        setProfilePicturePreview(data.profilePictureUrl || DEFAULT_PROFILE_PICTURE);
        console.log("ProfileSettings: Dados do perfil carregados da API:", data);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Erro ao carregar configurações do perfil da API.');
        console.error("ProfileSettings: Erro ao carregar da API:", errorData);
      }
    } catch (error) {
      console.error('ProfileSettings: Erro de rede ao carregar configurações da API:', error);
      toast.error('Erro de conexão ao carregar perfil da API.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    console.log("ProfileSettings: useEffect disparado. user:", user, "authLoading:", authLoading);

    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      toast.error('Você precisa estar logado para ver suas configurações de perfil.');
      router.push('/login');
      return;
    }

    // Inicializa formData com dados do AuthContext se disponíveis (para renderização inicial rápida)
    const initialProfileUrl = (user as any).profilePictureUrl || DEFAULT_PROFILE_PICTURE;
    setFormData((prev) => ({
      ...prev,
      nome: user.nome || '',
      usuario: user.usuario || '',
      email: user.email || '',
      bio: (user as any).bio || '',
      profilePictureUrl: initialProfileUrl,
      country: (user as any).country || '',
      // hasChangedUsername e usernameLastChangedAt serão sobrescritos pela API em seguida
    }));
    setProfilePicturePreview(initialProfileUrl);
    console.log("ProfileSettings: FormData inicializado com dados do AuthContext (temporário):", user);

    // Apenas busca da API se o usuário estiver presente (e não em loading de autenticação)
    // Chamada inicial da função
    fetchUserSettingsFromAPI();

    // Dependências do useEffect. Adicione `fetchUserSettingsFromAPI` aqui se ela for se tornar uma useCallback memoizada
  }, [user, authLoading, router]); // Dependências da função `useEffect`


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione um arquivo de imagem válido.');
        setProfilePictureFile(null);
        setProfilePicturePreview(formData.profilePictureUrl || DEFAULT_PROFILE_PICTURE);
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // Limite de 2MB
        toast.error('A imagem deve ter no máximo 2MB.');
        setProfilePictureFile(null);
        setProfilePicturePreview(formData.profilePictureUrl || DEFAULT_PROFILE_PICTURE);
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProfilePictureFile(null);
      setProfilePicturePreview(formData.profilePictureUrl || DEFAULT_PROFILE_PICTURE);
    }
  };

  const handleRemoveImage = () => {
    setProfilePictureFile(null); // Limpa o arquivo selecionado
    setProfilePicturePreview(DEFAULT_PROFILE_PICTURE); // Define o preview para a imagem padrão
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Limpa o input de arquivo
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Lógica para o fluxo de alteração de username
  const handleInitiateUsernameChange = () => {
    setUsernameError(''); // Limpa qualquer erro anterior
    if (formData.hasChangedUsername) {
      toast.error('Você já alterou seu nome de usuário uma vez. Novas alterações não são permitidas.');
      return;
    }
    setShowUsernameWarning(true); // Mostra o pop-up de aviso
  };

  const handleConfirmWarningAndProceed = () => {
    setShowUsernameWarning(false);
    setIsChangingUsernameFlow(true); // Inicia o fluxo de input
    setNewUsername(formData.usuario || ''); // Pré-preenche com o username atual para edição
    setConfirmNewUsername(formData.usuario || ''); // Pré-preenche para o segundo campo
    toast.success('Por favor, digite seu novo nome de usuário e confirme-o nos campos abaixo.');
  };

  const handleCancelUsernameFlow = () => {
    setShowUsernameWarning(false);
    setIsChangingUsernameFlow(false);
    setNewUsername('');
    setConfirmNewUsername('');
    setUsernameError('');
    // Restaura o username original do formData para o campo de exibição,
    // caso o usuário tenha começado a digitar mas cancelado
    setFormData(prev => ({ ...prev, usuario: user?.usuario || '' }));
    toast.dismiss(); // Remove qualquer toast de sucesso/erro anterior
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToastId = toast.loading('Salvando configurações...');

    console.log("handleSubmit: Iniciando processo de salvamento.");

    if (!user) {
      toast.dismiss(loadingToastId);
      toast.error('Você precisa estar logado para ver suas configurações de perfil.');
      setIsSubmitting(false);
      router.push('/login');
      return;
    }

    const dataToSend: { [key: string]: any } = { ...formData };

    // --- Lógica de Imagem ---
    let imageReadSuccess = true;
    if (profilePictureFile) {
      console.log("handleSubmit: Imagem de perfil detectada. Lendo como Base64.");
      const reader = new FileReader();
      reader.readAsDataURL(profilePictureFile);
      await new Promise<void>((resolve) => {
        reader.onloadend = () => {
          dataToSend.profilePictureBase64 = reader.result as string;
          // Não envie profilePictureUrl se estiver enviando Base64
          delete dataToSend.profilePictureUrl;
          console.log("handleSubmit: Leitura da imagem Base64 concluída.");
          resolve();
        };
        reader.onerror = () => {
          console.error("handleSubmit: Erro ao ler a imagem para upload.");
          toast.dismiss(loadingToastId);
          toast.error('Erro ao ler a imagem para upload.');
          setIsSubmitting(false);
          imageReadSuccess = false;
          resolve();
        };
      });

      if (!imageReadSuccess) {
        console.log("handleSubmit: Leitura da imagem falhou, abortando submit.");
        return;
      }
    } else if (profilePicturePreview === DEFAULT_PROFILE_PICTURE && formData.profilePictureUrl !== DEFAULT_PROFILE_PICTURE) {
      // Se o usuário clicou em "Remover Imagem" e a URL original NÃO era a padrão,
      // envia explicitamente profilePictureBase64 como null para remover a imagem do DB/servidor.
      console.log("handleSubmit: Sinal para remover imagem de perfil, enviando profilePictureBase64: null.");
      dataToSend.profilePictureBase64 = null;
      delete dataToSend.profilePictureUrl; // Garantir que não envia a URL antiga
    } else {
      // Nenhuma alteração na imagem, remove os campos relacionados à imagem do payload
      console.log("handleSubmit: Nenhuma imagem nova/removida, excluindo campos de imagem do payload.");
      delete dataToSend.profilePictureUrl;
      if ('profilePictureBase64' in dataToSend) {
        delete dataToSend.profilePictureBase64;
      }
    }

    // --- Lógica de Nome de Usuário ---
    if (isChangingUsernameFlow) {
      // Validação do frontend para o novo nome de usuário
      if (!newUsername.trim()) {
        setUsernameError('O novo nome de usuário não pode ser vazio.');
        toast.dismiss(loadingToastId);
        toast.error('O novo nome de usuário não pode ser vazio.');
        setIsSubmitting(false);
        return;
      }
      if (newUsername !== confirmNewUsername) {
        setUsernameError('Os nomes de usuário não coincidem.');
        toast.dismiss(loadingToastId);
        toast.error('Os nomes de usuário não coincidem.');
        setIsSubmitting(false);
        return;
      }
      if (newUsername === user?.usuario) { // Comparar com o username original do user logado
        setUsernameError('O novo nome de usuário deve ser diferente do atual.');
        toast.dismiss(loadingToastId);
        toast.error('O novo nome de usuário deve ser diferente do atual.');
        setIsSubmitting(false);
        return;
      }
      dataToSend.usuario = newUsername; // Envia o novo username
    } else {
      // Se o fluxo de mudança de username não está ativo,
      // garantimos que 'usuario' não seja enviado como uma alteração não intencional.
      // A API já lida com o que pode ser atualizado, então apenas removemos se não faz parte do fluxo de mudança.
      delete dataToSend.usuario;
    }

    // Remover campos que o backend gera ou que não são para serem enviados de volta
    delete dataToSend.hasChangedUsername;
    delete dataToSend.usernameLastChangedAt;
    delete dataToSend.email; // Email não é editável aqui

    console.log("handleSubmit: Dados a serem enviados para a API:", dataToSend);

    try {
      const res = await fetch(`/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        const result = await res.json();
        toast.dismiss(loadingToastId);
        toast.success(result.message || 'Perfil atualizado com sucesso!');
        if (refreshUser) {
          await refreshUser(); // Atualiza o contexto do usuário
        }
        // Chamada para rebuscar os dados atualizados do backend para garantir que hasChangedUsername e a nova data estejam corretos
        await fetchUserSettingsFromAPI();

        setProfilePictureFile(null); // Limpa o arquivo selecionado após o upload
        setIsChangingUsernameFlow(false); // Reseta o fluxo de mudança de username
        setNewUsername('');
        setConfirmNewUsername('');
        setUsernameError('');
        console.log("handleSubmit: Perfil atualizado com sucesso no backend.");
      } else {
        const errorData = await res.json();
        toast.dismiss(loadingToastId);
        toast.error(errorData.message || 'Falha ao atualizar perfil.');
        console.error("handleSubmit: Erro da API ao atualizar perfil:", errorData);
        // Se o erro for de username já em uso ou já alterado, exibe a mensagem no campo
        if (errorData.message && (errorData.message.includes('Nome de usuário já está em uso') || errorData.message.includes('Você só pode alterar seu nome de usuário uma vez'))) {
            setUsernameError(errorData.message);
        }
      }
    } catch (error) {
      console.error('handleSubmit: Erro de rede ao atualizar perfil:', error);
      toast.dismiss(loadingToastId);
      toast.error('Erro de conexão ao salvar perfil.');
    } finally {
      setIsSubmitting(false);
      console.log("handleSubmit: Finalizando processo de salvamento.");
    }
  };

  if (loading || authLoading) {
    return <div className="text-gray-400 text-center py-8">Carregando configurações do perfil...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar do Usuário */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-400 cursor-pointer group relative"
          onClick={handleAvatarClick}
        >
          <Image
            src={profilePicturePreview || DEFAULT_PROFILE_PICTURE}
            alt="Avatar do Usuário"
            width={96}
            height={96}
            className="object-cover w-full h-full transition-opacity duration-200 group-hover:opacity-75"
            onError={(e) => {
                e.currentTarget.src = DEFAULT_PROFILE_PICTURE;
            }}
          />
          {/* Ícone de câmera/edição ao passar o mouse */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
          </div>
        </div>
        <input
          type="file"
          id="profilePictureInput"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
        />
        {profilePicturePreview && profilePicturePreview !== DEFAULT_PROFILE_PICTURE && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-red-400 hover:underline text-sm mt-2"
            >
              Remover Imagem
            </button>
        )}
      </div>

      {/* Nome de Exibição */}
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-300">Nome de Exibição</label>
        <input
          type="text"
          id="nome"
          name="nome"
          value={formData.nome || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
        />
      </div>

      {/* Bloco do Nome de Usuário (com a nova lógica) */}
      <div>
        <label htmlFor="usuario" className="block text-sm font-medium text-gray-300">Nome de Usuário (único)</label>

        {/* Exibição do Nome de Usuário Atual e Botão/Status */}
        {!isChangingUsernameFlow && (
          <div className="flex items-center justify-between mt-1">
            <span className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm sm:text-sm p-2">
              {formData.usuario || 'Não definido'}
            </span>
            {formData.hasChangedUsername ? (
              <span className="ml-4 flex-shrink-0 text-gray-500 text-sm">
                Alterado em: {formatDateTime(formData.usernameLastChangedAt)}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleInitiateUsernameChange}
                className="ml-4 flex-shrink-0 bg-yellow-500 text-black px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Alterar
              </button>
            )}
          </div>
        )}

        {/* Aviso de Alteração Única */}
        {showUsernameWarning && (
          <div className="mt-4 p-4 bg-yellow-900 border border-yellow-700 rounded-md text-yellow-100">
            <p className="font-bold mb-2">Atenção: Alteração de Nome de Usuário</p>
            <p className="text-sm">
              Alterar seu nome de usuário é uma ação **única e irreversível**. Uma vez alterado,
              você não poderá mudá-lo novamente no futuro.
            </p>
            <p className="mt-2 text-sm">Tem certeza que deseja continuar?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelUsernameFlow}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmWarningAndProceed}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Sim, Continuar
              </button>
            </div>
          </div>
        )}

        {/* Campos para Novo Nome de Usuário */}
        {isChangingUsernameFlow && (
          <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-md">
            <p className="block text-sm font-medium text-gray-300 mb-2">Digite seu **novo** nome de usuário:</p>
            <input
              type="text"
              id="newUsername"
              name="newUsername"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
              placeholder="Digite o novo nome de usuário"
            />
            <p className="block text-sm font-medium text-gray-300 mt-4 mb-2">Confirme seu **novo** nome de usuário:</p>
            <input
              type="text"
              id="confirmNewUsername"
              name="confirmNewUsername"
              value={confirmNewUsername}
              onChange={(e) => setConfirmNewUsername(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
              placeholder="Confirme o novo nome de usuário"
            />
            {usernameError && <p className="mt-2 text-sm text-red-400">{usernameError}</p>}
            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={handleCancelUsernameFlow}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                    Cancelar
                </button>
            </div>
          </div>
        )}
      </div>

      {/* Email (Não editável aqui, apenas para exibição) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email || ''}
          disabled
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-400 shadow-sm sm:text-sm p-2 cursor-not-allowed"
        />
        <p className="mt-2 text-xs text-gray-500">Para alterar seu e-mail, entre em contato com o suporte.</p>
      </div>

      {/* Biografia */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-300">Biografia</label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          value={formData.bio || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
        ></textarea>
      </div>

      {/* País */}
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-300">País/Região</label>
        <select
          id="country"
          name="country"
          value={formData.country || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
        >
          <option value="">Selecione um país...</option>
          <option value="BR">Brasil</option>
          <option value="US">Estados Unidos</option>
          <option value="PT">Portugal</option>
          {/* Adicione mais países conforme necessário */}
        </select>
      </div>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || loading || authLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}