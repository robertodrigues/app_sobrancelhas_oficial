export function startKeepAlive() {
  const apiUrl = import.meta.env.VITE_API_URL || "https://app-sobrancelhas-oficial-5svn.onrender.com";
  const healthUrl = `${apiUrl.replace(/\/$/, "")}/health`;

  const ping = async () => {
    try {
      const response = await fetch(healthUrl);
      if (!response.ok) {
        console.warn(`Keep-alive ping falhou com status: ${response.status}`);
      }
    } catch (error) {
      console.warn("Keep-alive ping falhou:", error);
    }
  };

  // Executa imediatamente ao iniciar
  ping();

  // Configura o intervalo para rodar a cada 5 minutos (300000ms)
  const intervalId = setInterval(ping, 300000);
  return intervalId;
}