import { PlaygroundController } from './playground.controller';

describe('PlaygroundController', () => {
  let controller: PlaygroundController;

  beforeEach(() => {
    controller = new PlaygroundController();
  });

  it('returns the interactive playground page', () => {
    const html = controller.getPlayground();

    expect(html).toContain('<title>RAG Playground</title>');
    expect(html).toContain('POST /ingest/text');
    expect(html).toContain('POST /ingest/files');
    expect(html).toContain('POST /query');
    expect(html).toContain('GET /health');
  });
});
