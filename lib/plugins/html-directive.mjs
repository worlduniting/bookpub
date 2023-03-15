import { visit } from 'unist-util-visit';

/** @type {import('unified').Plugin<[], import('mdast').Root>} */
export default function remarkCustomDirective() {
    return function (tree) {
        visit(tree, 'containerDirective', function (node) {
            const data = node.data || (node.data = {});
            const hast = h(node.name, node.attributes);

            data.hName = hast.tagName;
            data.hProperties = hast.properties;
            data.unistHandler = customHandler;
        });
    };
}

function h(name, attrs) {
    return {
        tagName: name,
        properties: attrs || {},
    };
}

function customHandler(h, node) {
    const data = node.data || {};
    const tagName = data.hName || 'div';
    const properties = data.hProperties || {};
    return h(node.position, tagName, properties, node.children);
}
