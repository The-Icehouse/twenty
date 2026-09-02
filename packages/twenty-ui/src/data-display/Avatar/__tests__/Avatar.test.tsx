import { act, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';

import { Avatar } from '@ui/data-display/Avatar/Avatar';
import { ThemeProvider } from '@ui/theme-constants';

// Icehouse fork: Avatar shares one image probe per URL across every mount and remembers
// the verdict, so a table of recycled rows never re-fetches a logo that already failed.

type FakeImage = {
  src: string;
  onload: (() => void) | null;
  onerror: (() => void) | null;
};

const probes: FakeImage[] = [];

class ProbeImage implements FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private currentSrc = '';

  get src() {
    return this.currentSrc;
  }

  set src(value: string) {
    this.currentSrc = value;
    probes.push(this);
  }
}

const originalImage = globalThis.Image;

beforeAll(() => {
  // jsdom's Image never loads; the tests drive each probe's outcome.
  globalThis.Image = ProbeImage as unknown as typeof Image;
});

afterAll(() => {
  globalThis.Image = originalImage;
});

beforeEach(() => {
  probes.length = 0;
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider colorScheme="light">{children}</ThemeProvider>
);

const renderAvatar = (avatarUrl: string) =>
  render(<Avatar avatarUrl={avatarUrl} placeholder="Eldritch" />, {
    wrapper: Wrapper,
  });

const paintedImages = (container: HTMLElement) =>
  container.querySelectorAll('[style*="background-image"]');

const flushPersist = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

describe('Avatar image cache', () => {
  it('probes a URL once for every avatar showing it and paints when it loads', () => {
    const url = 'https://twenty-icons.com/shared-load.example';

    const { container } = render(
      <>
        <Avatar avatarUrl={url} placeholder="Eldritch" />
        <Avatar avatarUrl={url} placeholder="Eldritch" />
      </>,
      { wrapper: Wrapper },
    );

    expect(probes).toHaveLength(1);
    expect(probes[0].src).toBe(url);
    expect(screen.getAllByText('E')).toHaveLength(2);
    expect(paintedImages(container)).toHaveLength(0);

    act(() => probes[0].onload?.());

    expect(screen.queryByText('E')).not.toBeInTheDocument();
    expect(paintedImages(container)).toHaveLength(2);
  });

  it('keeps the placeholder after a failed probe and never probes that URL again', async () => {
    const url = 'https://twenty-icons.com/shared-fail.example';

    const first = renderAvatar(url);

    expect(probes).toHaveLength(1);

    act(() => probes[0].onerror?.());
    await flushPersist();

    expect(screen.getByText('E')).toBeVisible();

    first.unmount();
    renderAvatar(url);

    expect(probes).toHaveLength(1);
    expect(screen.getByText('E')).toBeVisible();
    expect(
      window.localStorage.getItem('icehouse.failedAvatarUrls') ?? '',
    ).toContain(url);
  });

  it('applies the cached verdict when the URL prop changes without a remount', () => {
    const failing = 'https://twenty-icons.com/recycled-fail.example';
    const loading = 'https://twenty-icons.com/recycled-load.example';

    const { container, rerender } = renderAvatar(failing);

    act(() => probes[0].onerror?.());

    rerender(<Avatar avatarUrl={loading} placeholder="Eldritch" />);

    expect(probes).toHaveLength(2);
    expect(screen.getByText('E')).toBeVisible();

    act(() => probes[1].onload?.());

    expect(paintedImages(container)).toHaveLength(1);

    rerender(<Avatar avatarUrl={failing} placeholder="Eldritch" />);

    expect(probes).toHaveLength(2);
    expect(screen.getByText('E')).toBeVisible();
    expect(paintedImages(container)).toHaveLength(0);

    rerender(<Avatar avatarUrl={loading} placeholder="Eldritch" />);

    expect(probes).toHaveLength(2);
    expect(paintedImages(container)).toHaveLength(1);
  });

  it('does not persist failures from hosts other than twenty-icons.com', async () => {
    const url = 'https://twenty.example.invalid/files/avatar?token=abc';

    renderAvatar(url);
    act(() => probes[0].onerror?.());
    await flushPersist();

    expect(screen.getByText('E')).toBeVisible();
    expect(
      window.localStorage.getItem('icehouse.failedAvatarUrls') ?? '',
    ).not.toContain(url);
  });
});
