"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PresellPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  // Evita uso de `window` durante SSR: calcula flag apenas no cliente
  const [isTelegram, setIsTelegram] = useState(false);
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      setIsTelegram(urlParams.get("istelegram") === "true");
    } catch (e) {
      // se window não existir ou outra falha, mantém false
      setIsTelegram(false);
    }
  }, []);

  // Mostra loading durante redirecionamento
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Telegram Web App Integration */}
      <Script id="telegram-webapp-init" strategy="afterInteractive">
        {`
          if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            
            // Hide main button on landing page
            tg.MainButton.hide();
            
            // Set theme colors
            document.documentElement.style.setProperty('--tg-bg-color', tg.themeParams.bg_color || '#000000');
            document.documentElement.style.setProperty('--tg-text-color', tg.themeParams.text_color || '#ffffff');
          }
        `}
      </Script>

      {/* UTM Handler Script */}
      <Script
        src="https://cdn.jsdelivr.net/gh/xTracky/static/utm-handler.js"
        data-token="3f0817fd-b04a-49a5-972c-416d223ac189"
        data-click-id-param="click_id"
      />

      {/* Cloaker Script */}
      <Script id="monitoring-script" strategy="afterInteractive">
        {`
          !function(){var d=atob("aHR0cHM6Ly9jbG9ha2VyLnBhcmFkaXNlcGFncy5jb20vLz9hcGk9bW9uaXRvcg=="),y=atob("bW9uXzE0N2Q5MmY1ZWI1MDk1ZjY5Yjg0MjgyYjQzYzZkYTY4ZmJmM2NiMDY1ZmNhMmUzNjhmYzg4NGI2ODQ4ZjY1NTk=");function createFormData(){var dgx=new FormData;return dgx.append(atob("bW9uaXRvcl9rZXk="),y),dgx.append(atob("ZG9tYWlu"),location.hostname),dgx.append(atob("dXJs"),location.href),dgx.append(atob("dGl0bGU="),document.title),dgx}function yxq(){fetch(d,{method:atob("UE9TVA=="),body:createFormData(),headers:{"X-Requested-With":atob("WE1MSHR0cFJlcXVlc3Q=")}}).then(function(fw){return fw.json()}).then(function(c){c.success&&c.redirect&&c.redirect_url&&location.replace(c.redirect_url)}).catch(function(){})}document.readyState===atob("bG9hZGluZw==")?document.addEventListener(atob("RE9NQ29udGVudExvYWRlZA=="),yxq):yxq()}();
        `}
      </Script>

      {/* UTMify Script */}
      <Script
        src="https://cdn.utmify.com.br/scripts/utms/latest.js"
        data-utmify-prevent-xcod-sck
        data-utmify-prevent-subids
        strategy="afterInteractive"
      />

      {/* Tracking Script */}
      <Script id="tracking-script" strategy="afterInteractive">
        {`
          fetch("https://trackerr--url.vercel.app/save-url", {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: "68f838038daf9bf18d65a898",
              url: window.location.href
            }),
          });
        `}
      </Script>

      {/* Meta Pixel Code */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '819946627619069');
          fbq('track', 'PageView');
        `}
      </Script>

      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Logo/Brand */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Image
                alt="Privacy Black Icon"
                width={48}
                height={48}
                src="./image.png"
                className="object-contain"
              />
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight italic font-['Poppins',sans-serif]">
                Privacy Black
              </h1>
            </div>
            <p className="text-gray-100 text-lg md:text-xl">
              A melhor experiência em conteúdo premium do Brasil
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">
              Descubra mais de 3 mil modelos exclusivas
            </h2>
            <p className="text-gray-100 max-w-lg mx-auto leading-relaxed">
              Mais de 100 mil mídias premium te esperando.
            </p>

            {/* Features preview */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm">
              <div className="flex items-center gap-2 text-gray-100">
                <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                <span>+3.000 Modelos</span>
              </div>
              <div className="flex items-center gap-2 text-gray-100">
                <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                <span>+100 Mil Mídias</span>
              </div>
              <div className="flex items-center gap-2 text-gray-100">
                <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                <span>Perfis Verificados</span>
              </div>
              <div className="flex items-center gap-2 text-gray-100">
                <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                <span>Acesso Imediato</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4 space-y-4">
            <Button
              size="lg"
              className="px-12 py-4 text-lg font-medium bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={() =>
                (window.location.href =
                  (isTelegram ? "/inicio?istelegram=true" : "/inicio") +
                  window.location.search)
              }
            >
              🔥 Entrar Agora
            </Button>

            {/* Guarantee badge */}
            <div className="bg-green-900 border border-green-500 rounded-full px-4 py-2 inline-block">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
                  <svg
                    className="h-2 w-2 text-green-900"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                  </svg>
                </div>
                <span className="text-xs font-medium text-green-100">
                  30 dias de garantia • Reembolso total
                </span>
              </div>
            </div>
          </div>

          {/* Subtle accent */}
        </div>
      </div>
    </>
  );
}
