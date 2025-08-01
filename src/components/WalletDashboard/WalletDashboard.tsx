// src/components/WalletDashboard/WalletDashboard.tsx
'use client';

import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { NumericFormat } from 'react-number-format';

// Interfaces para os dados da API
interface WalletBalance {
  balance: number;
}

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT_SENT' | 'PAYMENT_RECEIVED' | 'REFUND' | 'FEE';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  description?: string | null;
  relatedOrderId?: string | null;
  createdAt: string;
}

// Declare a interface para o objeto global MercadoPago (SDK)
declare global {
  interface Window {
    MercadoPago: any;
  }
}

// --- CONSTANTES PARA LIMITES DE DEPÓSITO E SAQUE ---
const MIN_DEPOSIT_AMOUNT = 10; // Valor mínimo para depósito
const MAX_DEPOSIT_AMOUNT = 5000; // Valor máximo para depósito

const MIN_WITHDRAWAL_AMOUNT = 20; // Exemplo: Valor mínimo para saque
const MAX_WITHDRAWAL_AMOUNT = 2000; // Exemplo: Valor máximo para saque (ajuste conforme saldo e regras)
// --- FIM NOVAS CONSTANTES ---


export default function WalletDashboard() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ESTADOS PARA O FLUXO DE DEPÓSITO COM MERCADO PAGO
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>(''); // Mantém como string para NumericFormat
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'boleto' | 'credit_card' | null>(null);

  // ESTADOS PARA O FLUXO DE SAQUE (NOVO!)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [pixKeyType, setPixKeyType] = useState<string>('CPF'); // Tipo da chave Pix
  const [pixKeyValue, setPixKeyValue] = useState<string>(''); // Valor da chave Pix
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);


  // Estados para dados do cartão de crédito e pagador
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpirationMonth, setCardExpirationMonth] = useState('');
  const [cardExpirationYear, setCardExpirationYear] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [docType, setDocType] = useState('CPF'); // Assumindo CPF como padrão
  const [docNumber, setDocNumber] = useState('');
  const [payerFirstName, setPayerFirstName] = useState('');
  const [payerLastName, setPayerLastName] = useState('');

  // Ref para o objeto MercadoPago SDK
  const mpInstance = useRef<any>(null);

  // Função para formatar valores monetários para BRL
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para formatar a data/hora
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      return date.toLocaleString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return 'Data inválida';
    }
  };

  // Função para traduzir o tipo de transação
  const getTransactionTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT': return 'Depósito';
      case 'WITHDRAWAL': return 'Saque';
      case 'PAYMENT_SENT': return 'Pagamento Enviado';
      case 'PAYMENT_RECEIVED': return 'Pagamento Recebido';
      case 'REFUND': return 'Reembolso';
      case 'FEE': return 'Taxa';
      default: return type;
    }
  };

  // Função para traduzir o status da transação
  const getTransactionStatusLabel = (status: Transaction['status']) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'COMPLETED': return 'Concluída';
      case 'FAILED': return 'Falhou';
      case 'CANCELED': return 'Cancelada';
      default: return status;
    }
  };

  // Função para obter a cor do status
  const getStatusColorClass = (status: Transaction['status']) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-500';
      case 'PENDING': return 'text-yellow-500';
      case 'FAILED':
      case 'CANCELED': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  // Função para buscar dados da carteira (saldo e transações)
  const fetchWalletData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar saldo
      const balanceRes = await fetch('/api/wallet/balance');
      if (balanceRes.ok) {
        const balanceData: WalletBalance = await balanceRes.json();
        setBalance(balanceData.balance);
      } else {
        const errorData = await balanceRes.json();
        throw new Error(errorData.message || 'Erro ao carregar saldo.');
      }

      // Buscar transações
      const transactionsRes = await fetch('/api/wallet/transactions');
      if (transactionsRes.ok) {
        const transactionsData: Transaction[] = await transactionsRes.json();
        setTransactions(transactionsData);
      } else {
        const errorData = await transactionsRes.json();
        throw new Error(errorData.message || 'Erro ao carregar transações.');
      }

    } catch (err: any) {
      console.error('Erro ao buscar dados da carteira:', err);
      setError(err.message || 'Falha ao carregar dados da carteira.');
      toast.error(err.message || 'Erro ao carregar dados da carteira.');
    } finally {
      setLoading(false);
    }
  };


  // Efeito para carregar o saldo e as transações
  useEffect(() => {
    if (authLoading) {
      return; // Espera a autenticação carregar
    }

    if (!user) {
      toast.error('Você precisa estar logado para ver sua carteira.');
      router.push('/login');
      return;
    }

    fetchWalletData();
  }, [user, authLoading, router]);


  // Efeito para carregar o SDK do Mercado Pago e inicializá-lo
  useEffect(() => {
    // Carrega o script do Mercado Pago SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => {
      // Verifica se o objeto MercadoPago está disponível globalmente
      if (window.MercadoPago) {
        // !!! ATENÇÃO: SUBSTITUA 'YOUR_PUBLIC_KEY' PELA SUA PUBLIC KEY REAL DO MERCADO PAGO !!!
        // Esta chave é segura para ser exposta no frontend.
        mpInstance.current = new window.MercadoPago('TEST-7eeaf80a-1395-49cf-9543-3a2a70911bf8', {
          locale: 'pt-BR'
        });
        console.log('MercadoPago SDK carregado e inicializado.');
      } else {
        console.error('MercadoPago SDK não carregou corretamente.');
        toast.error('Erro ao carregar o sistema de pagamentos.');
      }
    };
    script.onerror = () => {
      console.error('Falha ao carregar o script do MercadoPago SDK.');
      toast.error('Erro de conexão com o sistema de pagamentos.');
    };
    document.body.appendChild(script);

    return () => {
      // Limpeza: remove o script quando o componente é desmontado
      document.body.removeChild(script);
    };
  }, []); // Executa apenas uma vez no carregamento do componente

  // Função para cancelar o modal de depósito e limpar os estados
  const handleCancelDepositModal = () => {
    setShowDepositModal(false);
    setDepositAmount('');
    setSelectedPaymentMethod(null);
    setCardNumber('');
    setCardExpirationMonth('');
    setCardExpirationYear('');
    setCardCvv('');
    setCardHolderName('');
    setPayerFirstName('');
    setPayerLastName('');
    setDocNumber('');
    setIsProcessingDeposit(false);
    toast.dismiss(); // Remove qualquer toast ativo
  };

  // --- NOVA FUNÇÃO: Cancelar modal de saque ---
  const handleCancelWithdrawalModal = () => {
    setShowWithdrawalModal(false);
    setWithdrawalAmount('');
    setPixKeyType('CPF');
    setPixKeyValue('');
    setIsProcessingWithdrawal(false);
    toast.dismiss();
  };
  // --- FIM NOVA FUNÇÃO ---


  // FUNÇÃO PARA LIDAR COM O DEPÓSITO
  const handleDeposit = async () => {
    // Console log para debug
    console.log("handleDeposit: depositAmount (STRING BRUTA DO NUMERICFORMAT) =", depositAmount);

    setIsProcessingDeposit(true);
    const depositToastId = toast.loading('Processando depósito...');

    // Converte para número. NumericFormat já garantiu que a string é numérica ou vazia.
    // Usamos `parseFloat` para obter o valor numérico, após substituir vírgula por ponto.
    const amount = parseFloat(depositAmount.replace(',', '.'));
    console.log("handleDeposit: amount (FLOAT PARSEADO) =", amount);

    // --- LÓGICA DE VALIDAÇÃO DO VALOR COM FEEDBACK DE ERRO ---
    // A NumericFormat já impede negativos e zeros à esquerda, e formata.

    // 1. Campo vazio ou não numérico (ex: "R$ ." ou apenas "R$")
    if (depositAmount.trim() === '' || isNaN(amount)) {
        toast.error('Por favor, revise o valor do depósito. Ele deve ser um número válido.');
        setIsProcessingDeposit(false);
        toast.dismiss(depositToastId);
        return; 
    }
    
    // 2. Validação para valores menores que o mínimo (inclui zero)
    // Se o valor for 0, ou entre 1 e 9, esta condição o pegará e mostrará a mensagem correta.
    if (amount < MIN_DEPOSIT_AMOUNT) {
        toast.error(`O valor mínimo para depósito é ${formatCurrency(MIN_DEPOSIT_AMOUNT)}.`);
        setIsProcessingDeposit(false);
        toast.dismiss(depositToastId);
        return; 
    }
    
    // 3. Validação do limite máximo
    if (amount > MAX_DEPOSIT_AMOUNT) {
        toast.error(`O valor máximo para depósito é ${formatCurrency(MAX_DEPOSIT_AMOUNT)}. Por favor, tente um valor menor.`);
        setIsProcessingDeposit(false);
        toast.dismiss(depositToastId);
        return; 
    }
    // --- FIM LÓGICA DE VALIDAÇÃO DO VALOR ---


    // Validação do método de pagamento
    if (!selectedPaymentMethod) {
      console.log("handleDeposit: Erro de validação - método de pagamento não selecionado.");
      toast.error('Por favor, selecione um método de pagamento.');
      toast.dismiss(depositToastId); 
      setIsProcessingDeposit(false); 
      return; 
    }

    try {
      // VERIFICAÇÃO ADICIONAL: Garantir que user e user.email não são nulos/undefined
      if (!user || !user.email) {
        console.error("handleDeposit: Usuário ou email do usuário não disponível.");
        throw new Error("Dados do usuário não disponíveis para o pagamento.");
      }

      // Validação de campos do pagador (comum para todos, mas mais relevante para cartão)
      if (!payerFirstName || !payerLastName || !docNumber) {
        console.log("handleDeposit: Erro de validação - campos do pagador incompletos.");
        toast.error('Por favor, preencha seu nome completo e documento.');
        toast.dismiss(depositToastId);
        setIsProcessingDeposit(false);
        return; 
      }


      let paymentData: any = {
        amount: amount,
        paymentMethod: selectedPaymentMethod,
        payer: {
          email: user.email, // Email do usuário logado
          first_name: payerFirstName,
          last_name: payerLastName,
          identification: {
            type: docType,
            number: docNumber,
          },
        }
      };
      console.log("handleDeposit: paymentData inicial =", paymentData);


      if (selectedPaymentMethod === 'credit_card') {
        console.log("handleDeposit: Método selecionado - Cartão de Crédito.");
        // Validação básica dos campos do cartão
        if (!cardNumber || !cardExpirationMonth || !cardExpirationYear || !cardCvv || !cardHolderName) {
          console.log("handleDeposit: Erro de validação - campos do cartão incompletos.");
          toast.error('Por favor, preencha todos os dados do cartão.');
          toast.dismiss(depositToastId);
          setIsProcessingDeposit(false);
          return; 
        }

        // Limpar o número do cartão antes de enviar ao Mercado Pago
        const cleanedCardNumber = cardNumber.replace(/\s/g, ''); 
        console.log("handleDeposit: card number limpo =", cleanedCardNumber);


        // Cria o token do cartão usando o SDK do Mercado Pago
        if (!mpInstance.current) {
          console.log("handleDeposit: mpInstance.current é nulo.");
          toast.error('Sistema de pagamentos não inicializado. Tente novamente.');
          toast.dismiss(depositToastId);
          setIsProcessingDeposit(false);
          return; 
        }
        console.log("handleDeposit: Chamando createCardToken com dados:", {
          cardNumber: cleanedCardNumber, cardHolderName, cardExpirationMonth, cardExpirationYear, securityCode: cardCvv, identificationType: docType, identificationNumber: docNumber
        });
        const cardToken = await mpInstance.current.createCardToken({
          cardNumber: cleanedCardNumber, 
          cardholderName: cardHolderName,
          cardExpirationMonth: cardExpirationMonth,
          cardExpirationYear: cardExpirationYear,
          securityCode: cardCvv,
          identificationType: docType,
          identificationNumber: docNumber,
        });
        console.log("handleDeposit: Resposta de createCardToken =", cardToken);


        if (!cardToken || cardToken.error) {
          console.error('handleDeposit: Erro ao criar token do cartão:', cardToken.error);
          toast.error(cardToken.error?.message || 'Erro ao processar dados do cartão.');
          toast.dismiss(depositToastId);
          setIsProcessingDeposit(false);
          return; 
        }
        paymentData.cardToken = cardToken.id; 
        console.log("handleDeposit: cardToken.id =", cardToken.id);

      } else {
        console.log("handleDeposit: Método selecionado - Pix ou Boleto.");
      }

      console.log("handleDeposit: Chamando API de backend /api/wallet/process-deposit-payment...");
      // CHAMADA REAL PARA A NOVA API DE PROCESSAMENTO DE PAGAMENTO
      const res = await fetch('/api/wallet/process-deposit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      console.log("handleDeposit: Resposta da API de backend (res.ok) =", res.ok);


      if (!res.ok) {
        const errorData = await res.json();
        console.error("handleDeposit: Erro da API de backend:", errorData);
        // TRATAMENTO DE ERRO GENÉRICO PARA FALHAS DE PROCESSAMENTO DE BACKEND
        toast.error('Não foi possível processar seu depósito. Por favor, tente novamente ou utilize outro método de pagamento.');
        return; 
      }

      const result = await res.json(); 
      console.log("handleDeposit: Resultado da API de backend =", result);


      toast.success(result.message || `Depósito de ${formatCurrency(amount)} iniciado com sucesso!`);

      // Se for Pix, exibe o QR Code ou código copia-e-cola
      if (selectedPaymentMethod === 'pix' && result.qrCodeBase64) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <img className="h-10 w-10 rounded-full" src="/img/pix-icon.png" alt="Pix" /> 
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Depósito Pix de {formatCurrency(amount)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Escaneie o QR Code ou use o código abaixo para pagar.
                  </p>
                  {result.qrCodeBase64 && (
                    <img src={`data:image/png;base64,${result.qrCodeBase64}`} alt="QR Code Pix" className="w-32 h-32 mt-2" />
                  )}
                  {result.copyPasteCode && (
                    <p className="mt-2 text-xs text-gray-600 break-all">
                      Código Pix: {result.copyPasteCode}
                      <button
                        onClick={() => navigator.clipboard.writeText(result.copyPasteCode)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        Copiar
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Fechar
              </button>
            </div>
          </div>
        ), { duration: Infinity }); 
      }

      // Se for Boleto, exibe o link
      if (selectedPaymentMethod === 'boleto' && result.barcodeUrl) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <img className="h-10 w-10 rounded-full" src="/img/boleto-icon.png" alt="Boleto" /> 
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Depósito Boleto de {formatCurrency(amount)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Seu boleto foi gerado. Clique para visualizar e pagar.
                  </p>
                  <a
                    href={result.barcodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-blue-500 hover:text-blue-700 underline"
                  >
                    Abrir Boleto
                  </a>
                  {result.barcodeNumber && (
                    <p className="mt-2 text-xs text-gray-600 break-all">
                      Código de Barras: {result.barcodeNumber}
                      <button
                        onClick={() => navigator.clipboard.writeText(result.barcodeNumber)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        Copiar
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Fechar
              </button>
            </div>
          </div>
        ), { duration: Infinity });
      }

      // Atualiza o saldo e as transações após o sucesso da API
      await fetchWalletData();

      setShowDepositModal(false); 
      setDepositAmount(''); 
      setSelectedPaymentMethod(null); 
      setCardNumber('');
      setCardExpirationMonth('');
      setCardExpirationYear('');
      setCardCvv('');
      setCardHolderName('');
      setPayerFirstName('');
      setPayerLastName('');
      setDocNumber('');

    } catch (err: any) {
      console.error('Erro ao processar depósito:', err);
      // TRATAMENTO DE ERRO GENÉRICO PARA FALHAS DE BACKEND OU ERROS INESPERADOS
      toast.error('Não foi possível processar seu depósito. Por favor, revise os dados e tente novamente.');
    } finally {
      toast.dismiss(depositToastId);
      setIsProcessingDeposit(false);
    }
  };

  // FUNÇÃO PARA LIDAR COM O SAQUE
  const handleWithdrawal = async () => {
    console.log("handleWithdrawal: Função iniciada.");

    setIsProcessingWithdrawal(true);
    const withdrawalToastId = toast.loading('Processando saque...');

    const amount = parseFloat(withdrawalAmount.replace(',', '.'));

    // --- VALIDAÇÕES DO SAQUE ---
    // 1. Campo vazio ou não numérico
    if (withdrawalAmount.trim() === '' || isNaN(amount)) { 
      toast.error('Por favor, insira um valor numérico válido para o saque.');
      setIsProcessingWithdrawal(false);
      toast.dismiss(withdrawalToastId);
      return;
    }

    // 2. Valor deve ser maior que zero
    if (amount <= 0) { 
      toast.error('O valor do saque deve ser maior que zero.');
      setIsProcessingWithdrawal(false);
      toast.dismiss(withdrawalToastId);
      return;
    }

    // 3. Valor menor que o mínimo permitido
    if (amount < MIN_WITHDRAWAL_AMOUNT) { 
      toast.error(`O valor mínimo para saque é ${formatCurrency(MIN_WITHDRAWAL_AMOUNT)}.`);
      setIsProcessingWithdrawal(false);
      toast.dismiss(withdrawalToastId);
      return;
    }

    // 4. Saldo insuficiente
    if (balance === null || amount > balance) { 
      toast.error('Saldo insuficiente para realizar o saque.');
      setIsProcessingWithdrawal(false);
      toast.dismiss(withdrawalToastId);
      return;
    }

    // 5. Valor maior que o máximo permitido
    if (amount > MAX_WITHDRAWAL_AMOUNT) { 
      toast.error(`O valor máximo para saque é ${formatCurrency(MAX_WITHDRAWAL_AMOUNT)}. Por favor, tente um valor menor.`);
      setIsProcessingWithdrawal(false);
      toast.dismiss(withdrawalToastId);
      return;
    }

    // 6. Chave Pix vazia
    if (pixKeyValue.trim() === '') { 
      toast.error('Por favor, insira a chave Pix para o saque.');
      setIsProcessingWithdrawal(false);
      toast.dismiss(withdrawalToastId);
      return;
    }

    // TODO: Adicionar validação de formato da chave Pix (CPF, Email, Telefone, EVP)
    // Dependendo do pixKeyType, validar o formato de pixKeyValue (ex: regex para CPF)
    // Exemplo (adicionar no futuro, para simplificar agora):
    // if (pixKeyType === 'CPF' && !/^\d{11}$/.test(pixKeyValue)) {
    //   toast.error('CPF inválido.');
    //   setIsProcessingWithdrawal(false);
    //   toast.dismiss(withdrawalToastId);
    //   return;
    // }


    // --- CHAMADA REAL PARA A API DE BACKEND DE SAQUE ---
    try {
      const res = await fetch('/api/wallet/process-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawalAmount, // Já é a string limpa do NumericFormat
          pixKeyType: pixKeyType,
          pixKeyValue: pixKeyValue
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('handleWithdrawal: Erro da API de backend:', errorData);
        // Lança o erro para ser capturado pelo catch externo, mostrando a mensagem do backend
        throw new Error(errorData.message || 'Falha desconhecida ao processar saque.');
      }

      const result = await res.json();
      toast.success(result.message || `Saque de ${formatCurrency(amount)} solicitado com sucesso!`);
      await fetchWalletData(); // Atualiza saldo e histórico após o sucesso
      handleCancelWithdrawalModal(); // Fecha o modal após sucesso

    } catch (err: any) {
      console.error('Erro ao processar saque:', err);
      toast.error(err.message || 'Não foi possível processar seu saque. Por favor, tente novamente ou entre em contato com o suporte.');
    } finally {
      toast.dismiss(withdrawalToastId);
      setIsProcessingWithdrawal(false);
    }
  };
  // --- FIM FUNÇÃO handleWithdrawal ---


  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400">Carregando dados da carteira...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        <p>Erro: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-900 text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">Minha Carteira</h1>

      {/* Seção de Saldo */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8 flex flex-col items-center">
        <p className="text-lg text-gray-300">Saldo Atual</p>
        <p className="text-5xl font-extrabold text-green-400 mt-2">
          {balance !== null ? formatCurrency(balance) : formatCurrency(0)}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button
            onClick={() => {
              setShowDepositModal(true);
              setSelectedPaymentMethod(null); // Reseta a seleção ao abrir
              setDepositAmount(''); // Limpa o campo ao abrir
            }}
            className="flex-1 bg-yellow-500 text-black py-3 px-6 rounded-md font-semibold hover:bg-yellow-600 transition duration-200"
          >
            Depositar
          </button>
          <button
            onClick={() => {
              setShowWithdrawalModal(true); // <<<<<<< ABRE O NOVO MODAL DE SAQUE
              setWithdrawalAmount(''); // Limpa o campo de saque
              setPixKeyType('CPF'); // Define um valor padrão
              setPixKeyValue(''); // Limpa a chave Pix
            }}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 transition duration-200"
          >
            Sacar
          </button>
        </div>
      </div>

      {/* MODAL DE DEPÓSITO */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Depositar Fundos</h2>
            <p className="text-gray-300 mb-4">Insira o valor e escolha o método de pagamento.</p>

            {/* Campo de Valor com NumericFormat */}
            <div className="mb-6">
              <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-300 mb-2">Valor do Depósito</label>
              <NumericFormat
                id="depositAmount"
                value={depositAmount}
                onValueChange={(values) => {
                  setDepositAmount(values.value);
                }}
                prefix={'R$ '}
                decimalSeparator=","
                thousandSeparator="."
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={false} // Impede negativos
                allowLeadingZeros={false} // Impede zeros à esquerda (ex: 05 vira 5)
                placeholder="R$ 0,00"
                className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-white text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={isProcessingDeposit}
              />
            </div>

            {/* Seleção do Método de Pagamento */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('pix')}
                  className={`p-3 rounded-md border-2 ${selectedPaymentMethod === 'pix' ? 'border-yellow-500 bg-yellow-900' : 'border-gray-600 bg-gray-700'} text-white flex flex-col items-center justify-center hover:bg-gray-600 transition duration-200`}
                  disabled={isProcessingDeposit}
                >
                  <img src="/img/pix-icon.png" alt="Pix" className="w-8 h-8 mb-1" />
                  Pix
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('boleto')}
                  className={`p-3 rounded-md border-2 ${selectedPaymentMethod === 'boleto' ? 'border-yellow-500 bg-yellow-900' : 'border-gray-600 bg-gray-700'} text-white flex flex-col items-center justify-center hover:bg-gray-600 transition duration-200`}
                  disabled={isProcessingDeposit}
                >
                  <img src="/img/boleto-icon.png" alt="Boleto" className="w-8 h-8 mb-1" />
                  Boleto
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('credit_card')}
                  className={`p-3 rounded-md border-2 ${selectedPaymentMethod === 'credit_card' ? 'border-yellow-500 bg-yellow-900' : 'border-gray-600 bg-gray-700'} text-white flex flex-col items-center justify-center hover:bg-gray-600 transition duration-200`}
                  disabled={isProcessingDeposit}
                >
                  <img src="/img/credit-card-icon.png" alt="Cartão de Crédito" className="w-8 h-8 mb-1" />
                  Cartão
                </button>
              </div>
            </div>

            {/* Campos do Pagador (para Cartão) */}
            {selectedPaymentMethod === 'credit_card' && (
              <div className="space-y-4 mb-6">
                {/* Dados do Pagador (para Cartão) */}
                <div>
                  <label htmlFor="payerFirstName" className="block text-sm font-medium text-gray-300">Nome do Pagador</label>
                  <input
                    type="text"
                    id="payerFirstName"
                    value={payerFirstName}
                    onChange={(e) => setPayerFirstName(e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Primeiro Nome"
                    disabled={isProcessingDeposit}
                  />
                </div>
                <div>
                  <label htmlFor="payerLastName" className="block text-sm font-medium text-gray-300">Sobrenome do Pagador</label>
                  <input
                    type="text"
                    id="payerLastName"
                    value={payerLastName}
                    onChange={(e) => setPayerLastName(e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Sobrenome"
                    disabled={isProcessingDeposit}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="docType" className="block text-sm font-medium text-gray-300">Tipo Doc.</label>
                    <select
                      id="docType"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      disabled={isProcessingDeposit}
                    >
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="docNumber" className="block text-sm font-medium text-gray-300">Número Doc.</label>
                    <input
                      type="text"
                      id="docNumber"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Somente números"
                      disabled={isProcessingDeposit}
                    />
                  </div>
                </div>

                {/* Dados do Cartão */}
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-300">Número do Cartão</label>
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="XXXX XXXX XXXX XXXX"
                    disabled={isProcessingDeposit}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="cardExpirationMonth" className="block text-sm font-medium text-gray-300">Mês Exp.</label>
                    <input
                      type="text"
                      id="cardExpirationMonth"
                      value={cardExpirationMonth}
                      onChange={(e) => setCardExpirationMonth(e.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="MM"
                      maxLength={2}
                      disabled={isProcessingDeposit}
                    />
                  </div>
                  <div>
                    <label htmlFor="cardExpirationYear" className="block text-sm font-medium text-gray-300">Ano Exp.</label>
                    <input
                      type="text"
                      id="cardExpirationYear"
                      value={cardExpirationYear}
                      onChange={(e) => setCardExpirationYear(e.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="AA"
                      maxLength={2}
                      disabled={isProcessingDeposit}
                    />
                  </div>
                  <div>
                    <label htmlFor="cardCvv" className="block text-sm font-medium text-gray-300">CVV</label>
                    <input
                      type="text"
                      id="cardCvv"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="XXX"
                      maxLength={4}
                      disabled={isProcessingDeposit}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="cardHolderName" className="block text-sm font-medium text-gray-300">Nome no Cartão</label>
                  <input
                    type="text"
                    id="cardHolderName"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Nome Completo (igual ao cartão)"
                    disabled={isProcessingDeposit}
                  />
                </div>
              </div>
            )}

            {/* Campos do Pagador (para Pix/Boleto, se não for cartão) */}
            {selectedPaymentMethod !== 'credit_card' && selectedPaymentMethod !== null && (
              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="payerFirstName" className="block text-sm font-medium text-gray-300">Primeiro Nome</label>
                  <input
                    type="text"
                    id="payerFirstName"
                    value={payerFirstName}
                    onChange={(e) => setPayerFirstName(e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Primeiro Nome"
                    disabled={isProcessingDeposit}
                  />
                </div>
                <div>
                  <label htmlFor="payerLastName" className="block text-sm font-medium text-gray-300">Sobrenome</label>
                  <input
                    type="text"
                    id="payerLastName"
                    value={payerLastName}
                    onChange={(e) => setPayerLastName(e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Sobrenome"
                    disabled={isProcessingDeposit}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="docType" className="block text-sm font-medium text-gray-300">Tipo Doc.</label>
                    <select
                      id="docType"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      disabled={isProcessingDeposit}
                    >
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="docNumber" className="block text-sm font-medium text-gray-300">Número Doc.</label>
                    <input
                      type="text"
                      id="docNumber"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Somente números"
                      disabled={isProcessingDeposit}
                    />
                  </div>
                </div>
              </div>
            )}


            {/* Botões de Ação do Modal */}
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelDepositModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
                disabled={isProcessingDeposit}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeposit}
                disabled={
                    isProcessingDeposit ||
                    !selectedPaymentMethod ||
                    ((selectedPaymentMethod === 'credit_card' && (!cardNumber || !cardExpirationMonth || !cardExpirationYear || !cardCvv || !cardHolderName || !docNumber || !payerFirstName || !payerLastName)) ||
                    (selectedPaymentMethod !== 'credit_card' && (!payerFirstName || !payerLastName || !docNumber)))
                }
                className="px-6 py-2 bg-yellow-500 text-black rounded-md font-semibold hover:bg-yellow-600 transition duration-200"
              >
                {isProcessingDeposit ? 'Processando...' : 'Confirmar Depósito'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOVO! MODAL DE SAQUE */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Sacar Fundos</h2>
            <p className="text-gray-300 mb-4">Insira o valor e a chave Pix para saque.</p>

            {/* Campo de Valor do Saque */}
            <div className="mb-6">
              <label htmlFor="withdrawalAmount" className="block text-sm font-medium text-gray-300 mb-2">Valor do Saque</label>
              <NumericFormat
                id="withdrawalAmount"
                value={withdrawalAmount}
                onValueChange={(values) => {
                  setWithdrawalAmount(values.value);
                }}
                prefix={'R$ '}
                decimalSeparator=","
                thousandSeparator="."
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={false} // Saque não pode ser negativo
                allowLeadingZeros={false}
                placeholder="R$ 0,00"
                className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessingWithdrawal}
              />
            </div>

            {/* Tipo da Chave Pix */}
            <div className="mb-4">
              <label htmlFor="pixKeyType" className="block text-sm font-medium text-gray-300 mb-2">Tipo de Chave Pix</label>
              <select
                id="pixKeyType"
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value)}
                className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessingWithdrawal}
              >
                <option value="CPF">CPF</option>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Telefone</option>
                <option value="EVP">Chave Aleatória (EVP)</option>
              </select>
            </div>

            {/* Valor da Chave Pix */}
            <div className="mb-6">
              <label htmlFor="pixKeyValue" className="block text-sm font-medium text-gray-300 mb-2">Chave Pix</label>
              <input
                id="pixKeyValue"
                type="text"
                value={pixKeyValue}
                onChange={(e) => setPixKeyValue(e.target.value)}
                className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sua chave Pix (CPF, email, telefone ou aleatória)"
                disabled={isProcessingWithdrawal}
              />
            </div>

            {/* Botões de Ação do Modal de Saque */}
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelWithdrawalModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
                disabled={isProcessingWithdrawal}
              >
                Cancelar
              </button>
              <button
                onClick={handleWithdrawal} // <<<<<<< CHAMA A FUNÇÃO DE SAQUE
                disabled={ // Condição disabled simplificada para o saque
                  isProcessingWithdrawal ||
                  withdrawalAmount.trim() === '' || // Desabilita se o valor estiver vazio
                  pixKeyValue.trim() === '' // Desabilita se a chave pix estiver vazia
                }
                className="px-6 py-2 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 transition duration-200"
              >
                {isProcessingWithdrawal ? 'Processando...' : 'Confirmar Saque'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seção de Histórico de Transações */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-3 text-yellow-400">Histórico de Transações</h2>

        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-3 text-sm">Nenhuma transação encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-200">
                      {getTransactionTypeLabel(tx.type)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-200">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(tx.status)}`}>
                        {getTransactionStatusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-300">
                      {tx.description || 'N/A'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-400">
                      {formatDateTime(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}