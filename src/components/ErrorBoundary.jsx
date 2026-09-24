import { Component } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function DefaultFallback({ context }) {
  return (
    <div className="flex min-h-[240px] w-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Terjadi kesalahan tak terduga</CardTitle>
          <CardDescription>
            Halaman ini mengalami masalah{context ? ` (${context})` : ""} dan tidak dapat ditampilkan
            sebagaimana mestinya. Silakan muat ulang halaman atau kembali ke dasbor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CardFooter className="flex gap-2 p-0">
            <Button onClick={() => window.location.reload()}>Muat Ulang</Button>
            <Button variant="outline" onClick={() => window.location.assign("/dashboard")}>
              Kembali ke Dashboard
            </Button>
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      `[ErrorBoundary${this.props.context ? `:${this.props.context}` : ""}] Uncaught render error:`,
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <DefaultFallback context={this.props.context} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
