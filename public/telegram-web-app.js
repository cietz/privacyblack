// Telegram Web App Script
// Este script será carregado automaticamente pelo Telegram
if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;

  // Inicializar o Mini App
  tg.ready();

  // Expandir para tela cheia
  tg.expand();

  // Configurar o tema
  document.documentElement.style.setProperty(
    "--tg-theme-bg-color",
    tg.themeParams.bg_color
  );
  document.documentElement.style.setProperty(
    "--tg-theme-text-color",
    tg.themeParams.text_color
  );

  // Mostrar botão principal se necessário
  tg.MainButton.text = "ACESSAR MODELOS";
  tg.MainButton.show();

  // Event listener para o botão principal
  tg.MainButton.onClick(() => {
    // Redirecionar para a página de modelos
    window.location.href = "/modelos";
  });

  // Configurar botão de voltar
  tg.BackButton.onClick(() => {
    if (window.location.pathname !== "/") {
      window.history.back();
    } else {
      tg.close();
    }
  });

  // Mostrar botão de voltar em páginas internas
  if (window.location.pathname !== "/") {
    tg.BackButton.show();
  }
}
