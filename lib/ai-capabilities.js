'use strict';
// Shared by AI instructions and validators: runtime support does not imply wizard support.
const layout=require('./layout-builder');
const sectionTypes=Object.freeze(['custom','hero','text','features','gallery','carousel','cta','contact']);
const sections=Object.freeze({hero:'Opening image, heading, text and linked CTA',text:'Heading and paragraph text',cta:'Call to action with a link',contact:'Working built-in contact form; never rebuild as a layout element',custom:'Layout assembled from supported nodes and reusable elements'});
const nodeTypes=Object.freeze(layout.types.filter(type=>!['html','plugin'].includes(type)));
function instructions(site={}){
  const plugins=require('./plugins').catalog().filter(p=>site.plugins?.[p.id]?.enabled).map(p=>({id:p.id,name:p.name,sections:(p.sections||[]).map(s=>({type:s.type,label:s.label}))}));
  return `CAPABILITY CONTRACT (takes precedence over generic template examples):
Wizard-supported sections: ${JSON.stringify(sections)}.
Wizard-supported layout node types ONLY: ${nodeTypes.join(', ')}. Only div/flex/grid contain children. element references reusable templates, not arbitrary HTML.
Selection order: use a supported native section first; otherwise compose supported nodes into reusable elements and custom sections. Examples: benefit cards, process steps, static FAQ question/answer text. Static layout does NOT implement an accordion, carousel, form submission, checkout, authentication or external integration.
No html, plugin, form, input, textarea, select, button or script nodes in this wizard. Contact forms MUST be native contact sections with empty elementIds. Linked action buttons use native hero/cta fields.
Other native sections available in the manual editor, NOT supported by this wizard: ${sectionTypes.filter(type=>!Object.hasOwn(sections,type)).join(', ')}.
Enabled installed plugins (manual configuration only; do NOT generate plugin nodes or claim their configuration is complete): ${JSON.stringify(plugins)}.
If requested functionality cannot be built with wizard-supported sections/nodes, do not invent functionality or silently substitute a decorative mockup. Do not generate plugin code. During PLANNING ONLY add an unsupported array to the plan root: concise user-language strings explaining each requested unsupported requirement and the needed manual configuration, plugin or implementation; [] when all requirements are supported. Exclude these unsupported functions from generated elements and sections. During other stages keep the requested JSON shape unchanged; never add unsupported to theme or template objects.`;
}
module.exports={sectionTypes,sections,nodeTypes,instructions};
