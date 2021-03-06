var chai = require('chai');
var assert = chai.assert;
var msgUtils = require('./../src/msgUtils');
chai.should();
chai.use(require('chai-things'));

describe('msgUtils', function() {
  it('should extract tags from a message', function() {
    var msg = {
        envelope : {
          message: {
            text:  'http://google.com/#hello #tag #link #tag#intag'
          }
        }
    };

    var tags = msgUtils.extractTags(msg);

    assert(tags.length, 2);
    tags.should.include('#link');
    tags.should.not.include('#hello');
  });

  it('should extract a link from a message', function() {
    var msg = {
        envelope : {
          message: {
            text:  'http://google.com/#hello #tag #link #tag#intag'
          }
        }
    };

    var link = msgUtils.extractLinks(msg);

    assert.equal('http://google.com/#hello', link);
  });

  it('should extract multiple links from a message', function() {
    var msg = {
        envelope : {
          message: {
            text:  'http://google.com/#hello http://webdebs.org #tag #link #tag#intag'
          }
        }
    };

    var links = msgUtils.extractLinks(msg);
    
    assert.equal(links.length, 2)
    assert.equal('http://google.com/#hello', links[0]);
    assert.equal('http://webdebs.org', links[1]);
  });

  it('should extract a link from a message', function() {
    var msg = {
        envelope : {
          message: {
            text:  'http://google.com/#hello #tag #link #tag#intag'
          }
        }
    };

    var link = msgUtils.extractLinks(msg);

    assert.equal('http://google.com/#hello', link);
  });

  it('shouldn\'t extract any link from a message', function() {
    var msg = {
        envelope : {
          message: {
            text:  'lorem ipsum #tag #link #tag#intag'
          }
        }
    };

    var link = msgUtils.extractLinks(msg);

    assert.equal('', link);
  });


});
