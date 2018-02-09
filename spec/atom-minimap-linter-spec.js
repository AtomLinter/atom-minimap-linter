'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeEach, wait } from 'jasmine-fix';
import { join } from 'path';

const testPath = join(__dirname, 'fixtures', 'test.js');
const fakeLinter = join(__dirname, 'fake-linter');

describe('MinimapLinterBinding', () => {
  let workspaceElement;
  let editorView;
  let minimap;

  beforeEach(async () => {
    workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);

    // Activate Linter
    await atom.packages.activatePackage('linter');
    // Load and activate the fake linter.
    // NOTE: Somewhat Non-public API, as this isn't _supposed_ to take a path!
    await atom.packages.activatePackage(fakeLinter);

    // Open an editor on the test file
    const editor = await atom.workspace.open(testPath);
    // Grab the view for the editor
    editorView = atom.views.getView(editor);

    // Activate `minimap` and grab the minimap for the open editor
    const minimapPkg = await atom.packages.activatePackage('minimap');
    minimap = minimapPkg.mainModule.minimapForEditor(editor);

    // Activate minimap-linter now that all the dependencies are ready
    await atom.packages.activatePackage('minimap-linter');
  });

  describe('with an open editor that has a minimap', () => {
    beforeEach(async () => {
      // Trigger a lint, which should populate the marker layer
      atom.commands.dispatch(editorView, 'linter:lint');
      // Wait 500 ms for the lint
      await wait(500);
    });
    it('creates decoration for the linter markers', () => {
      expect(Object.keys(minimap.decorationsByMarkerId).length).toEqual(1);
    });
  });
});
