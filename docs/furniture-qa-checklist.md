# Furniture-by-Furniture QA Checklist

Use this checklist with the automated `npm run test:e2e` suite. Automation catches wiring regressions; this manual pass catches visual feel, proportion, shadows, and designer workflow quality.

## QA Order

1. Core Kitchen Units: Base Cabinet, Drawer Unit, Open Unit, Bottle Pullout, Sink Unit, L-Corner Base Cabinet, Wall Cabinet, Tall Storage Unit.
2. Wardrobe + Storage: Wardrobe, Sliding Wardrobe, Crockery Unit, Shoe Rack, Filing Cabinet.
3. Drawer/Hybrid Furniture: Bedside Table, Chest of Drawers, Dressing Table, TV Unit, Vanity Single/Double, Office Desk, L-Shape Desk, Kids Study Unit.
4. Open/Loose Furniture: Bookshelf, Beds, Sofas, Armchair, Coffee/Side/Console Tables, Dining Tables/Chairs, Office Chair, Mirror Cabinet.
5. Appliance-like Items: Chimney Hood, Cooktop/Hob, Fridge.

## Per Item Checklist

- Add from catalog in 2D; confirm the expected size/variant appears in the right panel.
- Select in 2D and 3D; confirm the right panel follows the selected visual item.
- Switch to 3D; orbit, zoom, and pan without losing selection.
- Open/close if available:
  - Shutters swing from the hinge edge and feel natural.
  - Handles and hinges stay attached through the full open amount.
  - Drawer fronts, boxes, runners, and handles slide together.
  - Pullouts and baskets extend logically.
  - Open units stay open and do not show fake shutter controls visually.
- Apply materials:
  - Exterior finish changes visible exterior panels.
  - Interior finish changes shelves/back/partitions/drawer boxes.
  - Hardware finish changes handles/hinges/runners.
  - Color override wins only after manual color edit.
  - Reset color returns to the selected finish color.
- Test selected-part editing:
  - Select a part row and confirm the exact part highlights in 3D.
  - Change selected-part material/color and confirm only that part changes.
  - Toggle part visibility and confirm the exact part hides.
  - Reset part overrides and confirm defaults return.
- Real mode:
  - Render opens without console errors.
  - Materials still look correct.
  - Shadows/contact shadows do not hide internals.
- Split view:
  - 2D pane remains usable.
  - 3D pane orbits and open/close/material controls still work.

## Pass Criteria

An item passes when the automated suite is green and the manual reviewer finds no obvious mismatch between catalog intent, right-panel controls, and 3D behavior. Log any visual-feel issue with the catalog item name, viewport mode, selected control, expected behavior, and screenshot.
