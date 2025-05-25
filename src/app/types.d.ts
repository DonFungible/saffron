import { QueryObserverResult } from '@tanstack/react-query';

interface Window {
  refetchGallery: () => Promise<QueryObserverResult>;
}
