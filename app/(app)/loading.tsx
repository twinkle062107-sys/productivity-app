export default function AppLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-qd-lavender/20 border-t-qd-lavender" />
      </div>
      <p className="mt-5 text-sm font-extrabold text-qd-muted animate-pulse">
        Loading quests...
      </p>
    </div>
  );
}
