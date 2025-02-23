import $ from 'jquery';
import Splitter from 'ui/splitter';
import fx from 'animation/fx';
import pointerMock from '../../helpers/pointerMock.js';
import { createEvent } from 'events/utils/index';

import 'generic_light.css!';

const SPLITTER_ITEM_CLASS = 'dx-splitter-item';
const RESIZE_HANDLE_CLASS = 'dx-resize-handle';

QUnit.testStart(() => {
    const markup =
        '<div id="splitter"></div>';

    $('#qunit-fixture').html(markup);
});

const moduleConfig = {
    beforeEach: function() {
        fx.off = true;

        const init = (options = {}) => {
            this.$element = $('#splitter').dxSplitter(options);
            this.instance = this.$element.dxSplitter('instance');
        };

        init();

        this.reinit = (options) => {
            this.instance.dispose();

            init(options);
        };

        this.getResizeHandles = () => {
            return this.$element.find(`.${RESIZE_HANDLE_CLASS}`);
        };
    },
    afterEach: function() {
        fx.off = false;
    }
};

QUnit.module('Resizing', moduleConfig, () => {
    function assertLayout(items, expectedLayout, assert) {
        items.toArray().forEach((item, index) => {
            assert.strictEqual(item.style.flexGrow, expectedLayout[index]);
        });
    }

    ['horizontal', 'vertical'].forEach(orientation => {
        QUnit.test(`items should be evenly distributed by default with ${orientation} orientation`, function(assert) {
            this.reinit({
                orientation,
                dataSource: [{ }, { }]
            });

            const items = this.$element.find(`.${SPLITTER_ITEM_CLASS}`);

            assertLayout(items, ['50', '50'], assert);
        });

        QUnit.test(`items with nested splitter should be evenly distributed by default with ${orientation} orientation`, function(assert) {
            this.reinit({ width: 208, height: 208, orientation: 'horizontal',
                dataSource: [{}, {}, {}, {
                    splitter: {
                        orientation,
                        dataSource: [{ }]
                    },
                }]
            });

            const items = this.$element.children(`.${SPLITTER_ITEM_CLASS}`);

            assertLayout(items, ['25', '25', '25', '25'], assert);
        });

        QUnit.test(`items should have no size if not visible, ${orientation} orientation`, function(assert) {
            this.reinit({
                orientation,
                dataSource: [{ }, { visible: false }, {}]
            });

            const items = this.$element.find(`.${SPLITTER_ITEM_CLASS}`);

            assertLayout(items, ['50', '0', '50'], assert);
        });

        QUnit.test(`first and second items resize should work when middle item is invisible, ${orientation} orientation`, function(assert) {
            this.reinit({
                width: 224, height: 224,
                orientation,
                dataSource: [{}, {}, { visible: false, }, { }, { }]
            });

            const items = this.$element.children(`.${SPLITTER_ITEM_CLASS}`);

            const pointer = pointerMock(this.getResizeHandles().eq(0));
            pointer.start().dragStart().drag(-25, -25).dragEnd();

            assertLayout(items, ['12.5', '37.5', '0', '25', '25'], assert);
        });

        QUnit.test(`last items resize should work when middle item is invisible, ${orientation} orientation`, function(assert) {
            this.reinit({
                width: 224, height: 224,
                orientation,
                dataSource: [{}, {}, { visible: false, }, { }, {}]
            });

            const items = this.$element.children(`.${SPLITTER_ITEM_CLASS}`);

            const pointer = pointerMock(this.getResizeHandles().eq(2));
            pointer.start().dragStart().drag(-25, -25).dragEnd();

            assertLayout(items, ['25', '25', '0', '12.5', '37.5'], assert);
        });

        QUnit.test(`items should be resized when their neighbour item is not visible, ${orientation} orientation`, function(assert) {
            this.reinit({
                width: 208, height: 208,
                orientation,
                dataSource: [{}, { visible: false, }, { },]
            });

            const items = this.$element.children(`.${SPLITTER_ITEM_CLASS}`);

            const pointer = pointerMock(this.getResizeHandles().eq(0));
            pointer.start().dragStart().drag(50, 50).dragEnd();

            assertLayout(items, ['75', '0', '25'], assert);
        });

        QUnit.test(`last two items should be able to resize when first item is not visible, ${orientation} orientation`, function(assert) {
            this.reinit({
                width: 208, height: 208,
                orientation,
                dataSource: [{ visible: false, }, {}, {},]
            });

            const items = this.$element.children(`.${SPLITTER_ITEM_CLASS}`);

            const pointer = pointerMock(this.getResizeHandles().eq(0));
            pointer.start().dragStart().drag(50, 50).dragEnd();

            assertLayout(items, ['0', '75', '25'], assert);
        });

        QUnit.test(`splitter should have no resize handles if only 1 item is visible, ${orientation} orientation`, function(assert) {
            this.reinit({
                orientation,
                dataSource: [{ visible: false }, { }]
            });

            const resizeHandles = this.$element.find(`.${RESIZE_HANDLE_CLASS}`);

            assert.strictEqual(resizeHandles.length, 0);
        });

        QUnit.test(`splitter should have 3 resize handles if 4 out of 6 are visible, ${orientation} orientation`, function(assert) {
            this.reinit({
                orientation,
                dataSource: [ { }, { }, { visible: false }, { }, { }, { visible: false }]
            });

            const resizeHandles = this.$element.find(`.${RESIZE_HANDLE_CLASS}`);

            assert.strictEqual(resizeHandles.length, 3);
        });
    });

    [
        { resizeDistance: 50, expectedSize: ['25', '75'], orientation: 'horizontal', rtl: true },
        { resizeDistance: -50, expectedSize: ['75', '25'], orientation: 'horizontal', rtl: true },
        { resizeDistance: -100, expectedSize: ['100', '0'], orientation: 'horizontal', rtl: true },
        { resizeDistance: 100, expectedSize: ['0', '100'], orientation: 'horizontal', rtl: true },
        { resizeDistance: 75, expectedSize: ['12.5', '87.5'], orientation: 'horizontal', rtl: true },
        { resizeDistance: 50, expectedSize: ['75', '25'], orientation: 'horizontal', rtl: false },
        { resizeDistance: -50, expectedSize: ['25', '75'], orientation: 'horizontal', rtl: false },
        { resizeDistance: -100, expectedSize: ['0', '100'], orientation: 'horizontal', rtl: false },
        { resizeDistance: 100, expectedSize: ['100', '0'], orientation: 'horizontal', rtl: false },
        { resizeDistance: 75, expectedSize: ['87.5', '12.5'], orientation: 'horizontal', rtl: false },
        { resizeDistance: 50, expectedSize: ['75', '25'], orientation: 'vertical', rtl: false },
        { resizeDistance: -50, expectedSize: ['25', '75'], orientation: 'vertical', rtl: false },
        { resizeDistance: -100, expectedSize: ['0', '100'], orientation: 'vertical', rtl: false },
        { resizeDistance: 100, expectedSize: ['100', '0'], orientation: 'vertical', rtl: false },
        { resizeDistance: 75, expectedSize: ['87.5', '12.5'], orientation: 'vertical', rtl: false },
    ].forEach(({ resizeDistance, expectedSize, orientation, rtl }) => {
        QUnit.test(`items should resize proportionally with ${orientation} orientation, rtl ${rtl}`, function(assert) {
            this.reinit({
                width: 208, height: 208,
                dataSource: [{ }, { }],
                orientation,
                rtlEnabled: rtl,
            });

            const items = this.$element.find(`.${SPLITTER_ITEM_CLASS}`);

            const pointer = pointerMock(this.getResizeHandles().eq(0));
            pointer.start().dragStart().drag(resizeDistance, resizeDistance).dragEnd();

            assertLayout(items, expectedSize, assert);
        });
    });

    [
        { resizeDistance: 50, expectedSize: ['75', '25'], orientation: 'horizontal' },
        { resizeDistance: -50, expectedSize: ['25', '75'], orientation: 'horizontal' },
        { resizeDistance: -100, expectedSize: ['0', '100'], orientation: 'horizontal' },
        { resizeDistance: 100, expectedSize: ['100', '0'], orientation: 'horizontal' },
        { resizeDistance: 75, expectedSize: ['87.5', '12.5'], orientation: 'horizontal' },
        { resizeDistance: 50, expectedSize: ['75', '25'], orientation: 'vertical' },
        { resizeDistance: -50, expectedSize: ['25', '75'], orientation: 'vertical' },
        { resizeDistance: -100, expectedSize: ['0', '100'], orientation: 'vertical' },
        { resizeDistance: 100, expectedSize: ['100', '0'], orientation: 'vertical' },
        { resizeDistance: 75, expectedSize: ['87.5', '12.5'], orientation: 'vertical' },
    ].forEach(({ resizeDistance, expectedSize, orientation }) => {
        QUnit.test(`items with nested splitter should resize proportionally with ${orientation} orientation`, function(assert) {
            this.reinit({
                width: 208, height: 208,
                dataSource: [{ }, {
                    splitter: {
                        orientation,
                        dataSource: [{ }]
                    },
                }],
                orientation
            });

            const items = this.$element.children(`.${SPLITTER_ITEM_CLASS}`);

            const pointer = pointerMock(this.getResizeHandles().eq(0));
            pointer.start().dragStart().drag(resizeDistance, resizeDistance).dragEnd();

            assertLayout(items, expectedSize, assert);
        });
    });

    [
        { resizeDistance: 500, expectedSize: ['100', '0'], orientation: 'horizontal' },
        { resizeDistance: -500, expectedSize: ['0', '100'], orientation: 'vertical' }
    ].forEach(({ resizeDistance, expectedSize, orientation }) => {
        QUnit.test(`resize item should not be resized beyound splitter borders with ${orientation} orientation`, function(assert) {
            this.reinit({ width: 208, height: 208, dataSource: [{ }, { }], orientation });

            const items = this.$element.find(`.${SPLITTER_ITEM_CLASS}`);

            const pointer = pointerMock(this.getResizeHandles().eq(0));
            pointer.start().dragStart().drag(resizeDistance, resizeDistance).dragEnd();

            assertLayout(items, expectedSize, assert);
        });
    });

    QUnit.test('resize item should not be resized beyound neighbour', function(assert) {
        this.reinit({ height: 208, orientation: 'vertical', dataSource: [{ }, { }, { }, { }] });

        const items = this.$element.find(`.${SPLITTER_ITEM_CLASS}`);

        const pointer = pointerMock(this.getResizeHandles().eq(0));
        pointer.start().dragStart().drag(0, 400).dragEnd();

        assertLayout(items, ['50', '0', '25', '25'], assert);
    });

    QUnit.test('resize item with nested splitter should not be resized beyound neighbour', function(assert) {
        this.reinit({ width: 208, dataSource: [ { splitter: { dataSource: [{ }] } }, { }, { }, { splitter: { dataSource: [{ }] } }] });

        const items = this.$element.children(`.${SPLITTER_ITEM_CLASS}`);

        const pointer = pointerMock(this.getResizeHandles().eq(1));
        pointer.start().dragStart().drag(-400, 0).dragEnd();

        assertLayout(items, ['25', '0', '50', '25'], assert);
    });
});

QUnit.module('Initialization', moduleConfig, () => {
    QUnit.test('Splitter should be initialized with Splitter type', function(assert) {
        assert.ok(this.instance instanceof Splitter);
    });

    QUnit.test('items count should be the same as datasource items count', function(assert) {
        this.reinit({ dataSource: [{ text: 'pane 1' }, { text: 'pane 2' }, { text: 'pane 3' }] });

        const items = this.$element.find(`.${SPLITTER_ITEM_CLASS}`);

        assert.strictEqual(items.length, 3);
    });

    QUnit.test('items should be able to be initialized with template', function(assert) {
        this.reinit({ dataSource: [{
            template: () => $('<div>').text('Pane 1') }, {
            template: () => $('<div>').text('Pane 2') }, {
            template: () => $('<div>').text('Pane 3') }]
        });

        const items = this.$element.find(`.${SPLITTER_ITEM_CLASS}`);

        assert.strictEqual(items.length, 3);
    });

    QUnit.test('Splitter with three items should have two resize handles', function(assert) {
        this.reinit({ dataSource: [{ text: 'pane 1' }, { text: 'pane 2' }, { text: 'pane 3' }] });

        assert.strictEqual(this.getResizeHandles().length, 2);
    });

    QUnit.test('Splitter with one item should have no handles', function(assert) {
        this.reinit({ dataSource: [{ template: () => $('<div>').text('Pane 1') }] });

        assert.strictEqual(this.getResizeHandles().length, 0);
    });

    QUnit.test('Splitter with no items should have no handles', function(assert) {
        this.reinit({ dataSource: [] });

        assert.strictEqual(this.getResizeHandles().length, 0);
    });
});


QUnit.module('Events', moduleConfig, () => {
    ['onResizeStart', 'onResize', 'onResizeEnd'].forEach(eventHandler => {
        QUnit.test(`${eventHandler} should be called when handle dragged`, function(assert) {
            const resizeHandlerStub = sinon.stub();
            this.reinit({
                [eventHandler]: resizeHandlerStub,
                dataSource: [{ text: 'pane 1' }, { text: 'pane 2' }]
            });

            const pointer = pointerMock(this.getResizeHandles().eq(0));

            pointer.start().dragStart().drag(0, 50).dragEnd();

            assert.strictEqual(resizeHandlerStub.callCount, 1);
        });

        QUnit.test(`${eventHandler} event handler should be able to be updated at runtime`, function(assert) {
            const handlerStub = sinon.stub();
            const handlerStubAfterUpdate = sinon.stub();

            this.reinit({
                [eventHandler]: handlerStub,
                dataSource: [{ text: 'pane 1' }, { text: 'pane 2' }]
            });

            const pointer = pointerMock(this.getResizeHandles().eq(0));

            pointer.start().dragStart().drag(0, 50).dragEnd();

            this.instance.option(eventHandler, handlerStubAfterUpdate);

            pointer.start().dragStart().drag(0, 50).dragEnd();

            assert.strictEqual(handlerStub.callCount, 1);
            assert.strictEqual(handlerStubAfterUpdate.callCount, 1);
        });
    });
});

QUnit.module('Nested Splitter Events', moduleConfig, () => {
    ['onResizeStart', 'onResize', 'onResizeEnd'].forEach(eventHandler => {
        QUnit.test(`${eventHandler} should be called when handle in nested splitter is dragged`, function(assert) {
            const resizeHandlerStub = sinon.stub();
            this.reinit({
                [eventHandler]: resizeHandlerStub,
                items: [{
                    splitter: {
                        dataSource: [{ text: 'pane 1' }, { text: 'pane 2' }]
                    }
                }]
            });

            const pointer = pointerMock(this.getResizeHandles()[0]);

            pointer.start().dragStart().drag(0, 50).dragEnd();

            assert.strictEqual(resizeHandlerStub.callCount, 1);
        });

        QUnit.test(`nestedSplitter.${eventHandler} should be called instead of parentSplitter.${eventHandler}`, function(assert) {
            const resizeHandlerStub = sinon.stub();
            const nestedSplitterResizeHandlerStub = sinon.stub();
            this.reinit({
                [eventHandler]: resizeHandlerStub,
                items: [{
                    splitter: {
                        [eventHandler]: nestedSplitterResizeHandlerStub,
                        dataSource: [{ text: 'pane 1' }, { text: 'pane 2' }]
                    }
                }]
            });

            const pointer = pointerMock(this.getResizeHandles()[0]);

            pointer.start().dragStart().drag(0, 50).dragEnd();

            assert.strictEqual(resizeHandlerStub.callCount, 0);
            assert.strictEqual(nestedSplitterResizeHandlerStub.callCount, 1);
        });

        QUnit.test(`nestedSplitter.${eventHandler} event handler should be able to be updated at runtime`, function(assert) {
            const handlerStub = sinon.stub();
            const handlerStubAfterUpdate = sinon.stub();

            this.reinit({
                items: [{
                    splitter: {
                        [eventHandler]: handlerStub,
                        dataSource: [{ text: 'pane 1' }, { text: 'pane 2' }]
                    }
                }]
            });

            let pointer = pointerMock(this.getResizeHandles().get(0));

            pointer.start().dragStart().drag(0, 50).dragEnd();

            assert.strictEqual(handlerStub.callCount, 1);
            assert.strictEqual(handlerStubAfterUpdate.callCount, 0);
            handlerStub.reset();

            this.instance.option(`items[0].splitter.${eventHandler}`, handlerStubAfterUpdate);

            pointer = pointerMock(this.getResizeHandles()[0]);
            pointer.start().dragStart().drag(0, 50).dragEnd();

            assert.strictEqual(handlerStub.callCount, 0);
            assert.strictEqual(handlerStubAfterUpdate.callCount, 1);
        });
    });

    QUnit.test('itemRendered should be called when nested splitter panes are rendered', function(assert) {
        const itemRenderedSpy = sinon.spy();

        this.reinit({
            onItemRendered: itemRenderedSpy,
            items: [{
                text: 'Pane_1',
            }, {
                splitter: {
                    items: [{ text: 'NestedPane_1' }, { text: 'NestedPane_2' }]
                }
            }]
        });

        assert.strictEqual(itemRenderedSpy.callCount, 4, 'itemRendered.callCount');
    });

    QUnit.test('nested splitter itemRendered should be called instead of parent.itemRendered', function(assert) {
        const itemRenderedSpy = sinon.spy();
        const nestedItemRenderedSpy = sinon.spy();

        this.reinit({
            onItemRendered: itemRenderedSpy,
            items: [{
                text: 'Pane_1',
            }, {
                splitter: {
                    onItemRendered: nestedItemRenderedSpy,
                    items: [{ text: 'NestedPane_1' }, { text: 'NestedPane_2' }]
                }
            }]
        });

        assert.strictEqual(itemRenderedSpy.callCount, 2, 'itemRendered.callCount');
        assert.strictEqual(nestedItemRenderedSpy.callCount, 2, 'itemRendered.callCount');
    });
});

QUnit.module('The dependency of ResizeHandle`s behavior on Splitter options', moduleConfig, () => {
    QUnit.test('ResizeHandle should be focusable when allowKeyboardNavigation option is set to true', function(assert) {
        this.reinit({
            dataSource: [{ text: 'Pane_1' }, { text: 'Pane_2' }, { text: 'Pane_3' }],
            allowKeyboardNavigation: true
        });

        this.getResizeHandles().each((index, resizeHandle) => {
            assert.strictEqual($(resizeHandle).attr('tabIndex'), '0', `resizeHandle[${index}] is focusable`);
        });
    });

    QUnit.test('ResizeHandle should not be focusable when allowKeyboardNavigation option is set to false', function(assert) {
        this.reinit({
            dataSource: [{ text: 'Pane_1' }, { text: 'Pane_2' }, { text: 'Pane_3' }],
            allowKeyboardNavigation: false
        });

        this.getResizeHandles().each((index, resizeHandle) => {
            assert.strictEqual($(resizeHandle).attr('tabIndex'), undefined, `resizeHandle[${index}] is not focusable`);
        });
    });

    QUnit.test('ResizeHandle should not be focusable when allowKeyboardNavigation option is set to false in runtime and vise versa', function(assert) {
        this.reinit({
            dataSource: [{ text: 'Pane_1' }, { text: 'Pane_2' }, { text: 'Pane_3' }],
            allowKeyboardNavigation: true,
        });

        this.instance.option('allowKeyboardNavigation', false);

        this.getResizeHandles().each((index, resizeHandle) => {
            assert.strictEqual($(resizeHandle).attr('tabIndex'), undefined, `resizeHandle[${index}] is not focusable`);
        });

        this.instance.option('allowKeyboardNavigation', true);

        this.getResizeHandles().each((index, resizeHandle) => {
            assert.strictEqual($(resizeHandle).attr('tabIndex'), '0', `resizeHandle[${index}] is focusable`);
        });
    });
});

QUnit.module('Keyboard support', moduleConfig, () => {
    QUnit.test('RegisterKeyHandler registers key handling on all internal resizeHandle components', function(assert) {
        const registerKeyHandlerSpy = sinon.spy();

        this.reinit({
            dataSource: [{ text: 'Pane_1' }, { text: 'Pane_2' }, { text: 'Pane_3' }],
        });

        this.instance.registerKeyHandler('enter', registerKeyHandlerSpy);

        this.getResizeHandles().eq(0).trigger(createEvent('keydown', { key: 'Enter' }));

        assert.strictEqual(registerKeyHandlerSpy.args[0][0].target, this.getResizeHandles().eq(0).get(0), 'event target is correct');
        assert.strictEqual(registerKeyHandlerSpy.callCount, 1);
        registerKeyHandlerSpy.reset();

        this.getResizeHandles().eq(1).trigger(createEvent('keydown', { key: 'Enter' }));
        assert.strictEqual(registerKeyHandlerSpy.args[0][0].target, this.getResizeHandles().eq(1).get(0), 'event target is correct');
        assert.strictEqual(registerKeyHandlerSpy.callCount, 1);
    });

    QUnit.test('RegisterKeyHandler registers key handling on all internal resizeHandle components, allowKeyboardNavigation is false', function(assert) {
        const registerKeyHandlerSpy = sinon.spy();

        this.reinit({
            dataSource: [{ text: 'Pane_1' }, { text: 'Pane_2' }, { text: 'Pane_3' }],
            allowKeyboardNavigation: false
        });

        this.instance.registerKeyHandler('enter', registerKeyHandlerSpy);

        this.getResizeHandles().eq(0).trigger(createEvent('keydown', { key: 'Enter' }));

        assert.strictEqual(registerKeyHandlerSpy.callCount, 0);
    });
});
