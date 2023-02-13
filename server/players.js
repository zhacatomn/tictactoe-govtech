module.exports = class Player {
  constructor(socket) {
    this.socket = socket;
    this.name = null;
    this.room = null;
    this.hasLeftRoom = false;
  }
  isSameAs(otherPlayer) {
    return this.socket.id === otherPlayer.socket.id;
  }
  toString() {
    return this.name === null
      ? `${this.socket.id}`
      : `${this.name} (${this.socket.id})`;
  }
};
