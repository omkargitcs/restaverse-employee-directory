import SearchBar from './components/SearchBar.jsx';
import EmployeeList from './components/EmployeeList.jsx';
import { EmptyState, ErrorState, SkeletonList } from './components/StateViews.jsx';
import { useEmployeeSearch } from './hooks/useEmployeeSearch.js';

export default function App() {
  const {
    query, setQuery, items, total, status, error,
    isRefreshing, hasMore, loadingMore, loadMoreError, loadMore, retry,
  } = useEmployeeSearch();

  const trimmed = query.trim();
  let content;
  if (status === 'error') {
    content = <ErrorState message={error} onRetry={retry} />;
  } else if (status === 'loading' && items.length === 0) {
    content = <SkeletonList />;
  } else if (items.length === 0) {
    content = <EmptyState query={trimmed} />;
  } else {
    content = (
      <>
        <EmployeeList employees={items} isRefreshing={isRefreshing} />
        {loadMoreError && <p className="inline-error" role="alert">{loadMoreError}</p>}
        {hasMore && (
          <div className="more">
            <button type="button" className="btn" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : `Load more (${total - items.length} remaining)`}
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Employee Directory</h1>
        <p>Find teammates across Engineering, Operations, Culinary Tech, Product, Support and Design.</p>
      </header>

      <SearchBar value={query} onChange={setQuery} isLoading={status === 'loading'} />

      <p className="count" aria-live="polite">
        {status === 'success' && items.length > 0 && `Showing ${items.length} of ${total} employee${total === 1 ? '' : 's'}`}
      </p>

      <main>{content}</main>
    </div>
  );
}
