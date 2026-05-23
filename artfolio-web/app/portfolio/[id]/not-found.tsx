import Link from "next/link";

export default function PortfolioNotFound() {
  return (
    <section className="py-14">
      <div className="app-container">
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <h1 className="text-2xl font-bold">Không tìm thấy portfolio</h1>
          <p className="mt-2 text-muted">
            Tác phẩm này không tồn tại hoặc đã bị xóa.
          </p>
          <Link href="/" className="btn btn-primary mt-5">
            Về trang chủ
          </Link>
        </div>
      </div>
    </section>
  );
}
