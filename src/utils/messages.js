const generateMessage = (username, text) => {
  return {
      username,
      text,
      createdAt: new Date().getTime()
  }
};

const generateLocationMessage = (username, locationCoords) => {

    const locationURL = `https://google.com/maps?q=${locationCoords.lat},${locationCoords.long}`;
    const newLocationURL = locationURL + "&output=embed";

    return {
        username,
        locationURL,
        newLocationURL,
        createdAt: new Date().getTime()
    }

};

module.exports = {
    generateMessage,
    generateLocationMessage
}