const extractEntities = (text) => {
  // Mock implementation: In real use, connect to NLP API like OpenAI or spaCy
  const urgencyKeywords = ['urgent', 'asap', 'immediately'].filter(word =>
    text.toLowerCase().includes(word)
  );

  return {
    dateTime: [],
    location: [],
    people: [],
    urgencyKeywords
  };
};

module.exports = {
  extractEntities
};
