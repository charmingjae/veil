import Link from "next/link";

export const NotFoundPage = () => {
  return (
    <main>
      <h1>페이지를 찾을 수 없습니다</h1>
      <Link href="/">홈으로</Link>
    </main>
  );
};
