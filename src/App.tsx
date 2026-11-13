
export function App() {
  return (
    <div className="min-h-screen bg-haven-yellow/20 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-card border-2 border-haven-brown-dark text-center max-w-sm w-full">
        <img
          src="/images/logo.webp"
          alt="Haven Logo"
          className="w-24 h-24 mx-auto mb-4 object-contain"
        />
        <h1 className="font-display text-3xl text-haven-orange-deep mb-2">
          Haven Game Voucher
        </h1>
        <p className="text-haven-brown-dark font-medium">
          Hack Club Haven Voucher &amp; Redemption
        </p>
      </div>
    </div>
  );
}

export default App;
