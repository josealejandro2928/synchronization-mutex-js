class WebSite {
  static id = 0
  constructor(name, description, visits = 0) {
    this.name = name;
    this.description = description;
    this.visits = visits;
    this.id = WebSite.id + 1
  }
}
let websitesSeed = [
  new WebSite('Google', 'Search Engine', 100),
  new WebSite('Facebook', 'Social Media', 50),
  new WebSite('Instagram', 'Social Media', 75)
];

module.exports = {
  WebSite,
  websitesSeed
}



