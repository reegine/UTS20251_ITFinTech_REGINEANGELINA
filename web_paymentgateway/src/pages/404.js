import Link from 'next/link';
import Head from 'next/head';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Oops! Page Not Found 💖</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Head>

      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          {/* <div className="text-9xl">🌸🐰✨</div> */}
          
          <h1 className="text-8xl font-extrabold text-pink-500 drop-shadow-sm">
            404
          </h1>
          <h2 className="mt-4 text-3xl font-bold text-pink-700">
            Oopsie! Page not found 💔
          </h2>
          <p className="mt-2 text-pink-600">
            Looks like you wandered off the path... but don’t worry, let’s get you back home! 🏡
          </p>

          <div className="mt-8 flex flex-col gap-4 items-center">
            <Link
              href="/"
              className="inline-block bg-pink-500 text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-pink-600 transition duration-200"
            >
              ⬅️ Take me home
            </Link>

            {/* <button
              onClick={() => window.history.back()}
              className="text-pink-600 hover:text-pink-800 font-medium underline decoration-dotted"
            >
              🔙 Go back to previous page
            </button> */}
          </div>

          {/* Extra cute touch */}
          <p className="mt-6 text-sm text-pink-400">
            Made with 💕 just for you
          </p>
        </div>
      </div>
    </>
  );
}
