// demo.js
// Simple example showing how to call the public API in sequence (no Blockly).

(async function runDemo() {
  // Wait for the scene to finish creating
  await IsoMoveAPI.ready();

  console.log('Initial state:', IsoMoveAPI.getState());

  // Show a small “script” of moves:
  await IsoMoveAPI.face('right');          // face right
  await IsoMoveAPI.moveForward(1);         // go 2 tiles
//   await IsoMoveAPI.rotateLeft();           // now facing up
//   await IsoMoveAPI.moveForward(1);

  // Try to grab the star (works only if star is in front and behind is free)
  //const grabbed = await IsoMoveAPI.toggleTow();
  //console.log('Grabbed?', grabbed);

  // If grabbed, tow it around a bit
  //if (grabbed) {
  await IsoMoveAPI.moveForward(3);
  await IsoMoveAPI.rotateRight();
  await IsoMoveAPI.moveForward(1);
  // Drop it
  await IsoMoveAPI.toggleTow();
  //}

  // Try a backwards step
  await IsoMoveAPI.moveBackward(1);

  console.log('Final state:', IsoMoveAPI.getState());
})();
