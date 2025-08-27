import Home from '#src/components/home.js';
import LoadingArea from '#src/components/loading-area.js';
import Notice from '#src/components/notice.js';
import usePave from '#src/hooks/use-pave.js';

export default () => {
  const { data, error, isLoading, execute } = usePave({
    query: {
      players: {
        $: { size: 100 },
        id: {},
        name: {},
        nickname: {},
        avatarUrl: {},
        bounties: { id: {} },
        items: { item: { id: {}, type: {}, attributes: {} }, isEquipped: {} }
      }
    }
  });

  return (
    <>
      {isLoading && <LoadingArea />}
      {error && <Notice>{error}</Notice>}
      {data && <Home players={data?.players ?? []} reload={execute} />}
    </>
  );
};
