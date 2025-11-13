import { NextRequest, NextResponse } from "next/server";
async function randomPersonName() {
  const names = [
    "Ana",
    "Bruno",
    "Carla",
    "Daniel",
    "Eduarda",
    "Felipe",
    "Gabriela",
    "Henrique",
  ];
  return names[Math.floor(Math.random() * names.length)];
}
async function randomEmail() {
  const domains = ["example.com", "test.com", "demo.com", "sample.com"];
  const name = Math.random().toString(36).substring(2, 10);
  return `${name}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      value,
      metadata,
      name: bodyName,
      email: bodyEmail,
      description: bodyDescription,
      webhook_url: bodyWebhook,
    } = body;

    // Validação dos dados recebidos
    const webhook_url = bodyWebhook || "https://imperiovips.com/webhook/";
    const description = bodyDescription || "Pagamento via WiinPay";
    const name = bodyName || (await randomPersonName());
    const email = bodyEmail || (await randomEmail());
    // Accept either decimal reais (e.g. 19.9 or 0.04) OR integer centavos (e.g. 1990)
    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: "Campo value é obrigatório" },
        { status: 400 }
      );
    }

    // Normalize incoming value to number
    const incomingNumber = Number(value);
    if (Number.isNaN(incomingNumber)) {
      return NextResponse.json(
        { error: "Campo value deve ser um número" },
        { status: 400 }
      );
    }

    // If value looks like reais decimal (less than, say, 1000), interpret as reais and convert to cents
    // If value is already a large integer (>1000), assume it's cents
    let valueInCents: number;
    if (incomingNumber > 1000) {
      // probably already in cents
      valueInCents = Math.round(incomingNumber);
    } else {
      // treat as reais decimal
      // Use truncation to avoid rounding up small fractional-cent values.
      // e.g. 0.1990 * 100 = 19.9 -> trunc -> 19 (centavos)
      valueInCents = Math.trunc(incomingNumber * 100);
    }

    // Minimum validation: WiinPay requires minimum 3 reais, but we'll allow smaller for testing
    // NOTE: According to docs, minimum is 3 reais
    if (valueInCents < 300) {
      // 3 reais = 300 centavos
      console.log(
        "/api/pix POST - rejected: valueInCents < 300 (3 reais)",
        valueInCents
      );
      return new NextResponse(
        JSON.stringify({ error: "Valor minimo permitido: 3.00" }),
        {
          status: 400,
        }
      );
    }

    // Debug log to confirm incoming value from frontend (raw and normalized cents)
    console.log(
      "/api/pix POST received value (raw):",
      value,
      "parsed:",
      incomingNumber,
      "cents:",
      valueInCents
    );
    if (!name || !email || !description || !webhook_url) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, email, description, webhook_url" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.wiinpay.com.br/payment/create", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN1cGVybWVnYWdhYmk2QGdtYWlsLmNvbSIsImlhdCI6MTc1ODI5MzU5NH0.b-KPzKvAAfN9L3-nDBNwy_kjSEAEpJxnnp1yOzb88ko",
        // forward value in reais (decimal) to WiinPay
        value: incomingNumber,
        name,
        email,
        description,
        webhook_url,
        metadata: metadata || {},
      }),
    });

    console.log(
      "Proxied request to WiinPay with body value (reais):",
      incomingNumber,
      "status:",
      response.status
    );

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      // response not JSON
      data = text;
    }

    if (!response.ok) {
      // According to docs, 201 = success, 422 = validation error, 401 = unauthorized, 500 = server error
      console.log(`/api/pix POST - WiinPay error status: ${response.status}`);
      const errorText = text;
      console.log(`/api/pix POST - WiinPay error response:`, errorText);

      let errorMessage = "Erro ao gerar pagamento PIX";
      if (response.status === 422) {
        errorMessage = "Dados inválidos enviados para WiinPay";
      } else if (response.status === 401) {
        errorMessage = "Chave API inválida";
      } else if (response.status === 500) {
        errorMessage = "Erro interno na WiinPay";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          status: response.status,
          remote: errorText,
        },
        { status: 502 }
      );
    }

    // Tentar extrair QR code de formas comuns que a API pode retornar
    const qr_candidates = [
      data?.qr_code,
      data?.qrCode,
      data?.qrcode,
      data?.payload,
      data?.pix?.qrcode,
      data?.pix_qr,
      data?.data?.qr_code,
      data?.payment?.qr_code,
    ];
    const qr_code =
      qr_candidates.find((v) => typeof v === "string" && v.length > 0) || null;

    const b64_candidates = [
      data?.qr_code_base64,
      data?.qrCodeBase64,
      data?.qr_code_base64_string,
      data?.base64,
    ];
    const qr_code_base64 =
      b64_candidates.find((v) => typeof v === "string" && v.length > 0) || null;

    // Se não há QR nem base64, retorna erro com payload remoto
    if (!qr_code && !qr_code_base64) {
      return NextResponse.json(
        {
          error: "QR Code não encontrado na resposta da WiinPay",
          remote: data,
        },
        { status: 502 }
      );
    }

    // Se não veio base64, gerar PNG do payload do QR e codificar em base64
    let resolved_qr_code_base64 = qr_code_base64;
    if (!resolved_qr_code_base64 && qr_code) {
      try {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&data=${encodeURIComponent(
          qr_code
        )}`;
        const qrResp = await fetch(qrApiUrl);
        if (qrResp.ok) {
          const arr = await qrResp.arrayBuffer();
          // Buffer is available in Node runtime used by Next
          const buf = Buffer.from(arr);
          resolved_qr_code_base64 = `data:image/png;base64,${buf.toString(
            "base64"
          )}`;
        }
      } catch (e) {
        // ignore - we'll return without base64
        resolved_qr_code_base64 = null;
      }
    }

    // Normalizar campos a partir do payload remoto
    const normalizedId =
      data?.id ||
      data?.paymentId ||
      data?.payment_id ||
      data?.data?.paymentId ||
      data?.data?.payment_id ||
      data?.payment?.id ||
      null;

    const createdAt =
      data?.created_at || data?.data?.created_at || new Date().toISOString();

    const expiresAt =
      data?.expires_at ||
      data?.data?.expires_at ||
      new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const normalizedStatus = data?.status || data?.data?.status || "pending";

    // Retorna valor em cents e em reais (número) e formatado para facilitar uso no frontend
    const amount_cents = valueInCents;
    const amount = typeof amount_cents === "number" ? amount_cents / 100 : null;
    const amount_formatted =
      typeof amount === "number" ? amount.toFixed(2).replace(".", ",") : null;

    return NextResponse.json({
      id: normalizedId,
      qr_code,
      qr_code_base64: resolved_qr_code_base64,
      amount_cents,
      amount,
      amount_formatted,
      created_at: createdAt,
      status: normalizedStatus,
      expires_at: expiresAt,
      raw: data,
    });
  } catch (error) {
    console.error("/api/pix POST - erro interno:", error);
    let errorMessage = "Erro interno do servidor";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    return NextResponse.json(
      { error: errorMessage, details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID do pagamento é obrigatório" },
      { status: 400 }
    );
  }

  try {
    console.log(`/api/pix GET - checking payment status for ID: ${id}`);
    const response = await fetch(
      `https://api.wiinpay.com.br/payment/list/${id}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN1cGVybWVnYWdhYmk2QGdtYWlsLmNvbSIsImlhdCI6MTc1ODI5MzU5NH0.b-KPzKvAAfN9L3-nDBNwy_kjSEAEpJxnnp1yOzb88ko`,
        },
      }
    );

    console.log(`/api/pix GET - WiinPay response status: ${response.status}`);

    if (response.status === 200) {
      const data = await response.json();
      console.log(
        `/api/pix GET - WiinPay response data:`,
        JSON.stringify(data, null, 2)
      );
      return NextResponse.json(data);
    } else {
      let errorData: any = { message: "Unknown error" };
      try {
        errorData = await response.json();
      } catch (jsonError) {
        // Se não conseguir fazer parse do JSON, tenta pegar o texto
        const text = await response.text();
        errorData = { message: text || "Erro desconhecido na API externa" };
      }
      console.log(
        `/api/pix GET - WiinPay error response:`,
        JSON.stringify(errorData, null, 2)
      );
      return NextResponse.json(
        { error: errorData.message || "Erro ao consultar pagamento" },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error(`/api/pix GET - Network error:`, error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
