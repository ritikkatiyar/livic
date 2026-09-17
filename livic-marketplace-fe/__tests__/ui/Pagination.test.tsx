import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { getPageItems, Pagination } from '@/components/ui/Pagination';

describe('getPageItems', () => {
  it('lists every page when there are few pages', () => {
    expect(getPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('collapses distant pages into ellipses', () => {
    expect(getPageItems(1, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 10]);
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 10]);
    expect(getPageItems(10, 10)).toEqual([1, 'ellipsis-start', 6, 7, 8, 9, 10]);
  });
});

describe('Pagination Component', () => {
  const buildHref = (page: number) => `/rooms?page=${page}`;

  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} buildHref={buildHref} />);
    expect(container.firstChild).toBeNull();
  });

  it('marks the current page and links to neighbours', () => {
    render(<Pagination page={5} totalPages={10} buildHref={buildHref} />);
    expect(screen.getByRole('link', { name: 'Page 5' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Previous page' })).toHaveAttribute('href', '/rooms?page=4');
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute('href', '/rooms?page=6');
    expect(screen.getByRole('link', { name: 'Page 10' })).toHaveAttribute('href', '/rooms?page=10');
  });

  it('disables Prev on the first page and Next on the last page', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} buildHref={buildHref} />);
    expect(screen.queryByRole('link', { name: 'Previous page' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next page' })).toBeInTheDocument();

    rerender(<Pagination page={3} totalPages={3} buildHref={buildHref} />);
    expect(screen.getByRole('link', { name: 'Previous page' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Next page' })).not.toBeInTheDocument();
  });
});
