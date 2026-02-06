export const getApiUrl = (path: string) => {
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
};

export const authFetch = async (url: string, options: RequestInit = {}) => {

    const token = typeof window !== 'undefined' ? localStorage.getItem("goldrush_token") : null;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}), // Adiciona o token se existir
    } as HeadersInit;

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem("goldrush_token"); // Limpa token velho
            window.location.href = "/login";
        }
    }

    return response;
};