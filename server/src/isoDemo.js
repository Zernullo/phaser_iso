// isoDemo.js
// Simple example showing how to call the IsoMoveAPI in sequence.

(async function runIsoDemo() {
  console.log('Demo script loaded');
  console.log('IsoMoveAPI available?', typeof IsoMoveAPI !== 'undefined');
  
  if (typeof IsoMoveAPI === 'undefined') {
    console.error('IsoMoveAPI is not defined! Make sure isoMoveExample.js loads first.');
    return;
  }

  // Wait for the scene to finish creating
  console.log('Waiting for game to be ready...');
  await IsoMoveAPI.ready();
  console.log('Game is ready!');

  console.log('Initial state:', IsoMoveAPI.getState());

  // Show a small "script" of moves:
  console.log('Facing right...');
  await IsoMoveAPI.face('right');
  
  console.log('Moving forward 2 tiles...');
  await IsoMoveAPI.moveForward(2);
  
  console.log('Rotating left (now facing north)...');
  await IsoMoveAPI.rotateLeft();
  
  console.log('Moving forward 1 tile...');
  await IsoMoveAPI.moveForward(1);
  
  console.log('Rotating right (now facing east)...');
  await IsoMoveAPI.rotateRight();
  
  console.log('Moving forward 2 tiles...');
  await IsoMoveAPI.moveForward(2);
  
  console.log('Facing south...');
  await IsoMoveAPI.face('south');
  
  console.log('Moving backward 1 tile...');
  await IsoMoveAPI.moveBackward(1);
  
  console.log('Rotating right twice...');
  await IsoMoveAPI.rotateRight();
  await IsoMoveAPI.rotateRight();
  
  console.log('Moving forward 1 tile...');
  await IsoMoveAPI.moveForward(1);

  console.log('Final state:', IsoMoveAPI.getState());
  console.log('Demo complete!');
})();