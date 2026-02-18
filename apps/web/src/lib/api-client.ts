const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    // Token retrieval will be wired up during auth implementation
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, { headers: this.getHeaders() });
    if (!res.ok) throw await this.handleError(res);
    return res.json();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw await this.handleError(res);
    return res.json();
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await this.handleError(res);
    return res.json();
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw await this.handleError(res);
    return res.json();
  }

  private async handleError(res: Response): Promise<Error> {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    const error = new Error(body.error || body.message || 'Request failed');
    (error as any).statusCode = res.status;
    (error as any).code = body.code;
    return error;
  }
}

export const apiClient = new ApiClient();
