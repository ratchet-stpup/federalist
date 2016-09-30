import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("alertActions", () => {
  let fixture;
  let dispatch;
  let authErrorActionCreator, httpErrorActionCreator, httpSuccessActionCreator,
      setStaleActionCreator, clearActionCreator;
  
  beforeEach(() => {
    dispatch = spy();
    authErrorActionCreator = stub();
    httpErrorActionCreator = stub();
    httpSuccessActionCreator = stub();
    setStaleActionCreator = stub();
    clearActionCreator = stub();
    
    fixture = proxyquire("../../../../assets/app/actions/alertActions", {
      "./actionCreators/alertActions": {
        authError: authErrorActionCreator,
        httpError: httpErrorActionCreator,
        httpSuccess: httpSuccessActionCreator,
        setStale: setStaleActionCreator,
        clear: clearActionCreator
      },
      "../store": {
        dispatch: dispatch
      }
    }).default;
  });

  describe("auth error", () => {
    it("sends an auth error action to the store", () => {
      const authErrorAction = {
        e: "is for error, that's good enough for me"
      };
      authErrorActionCreator.withArgs().returns(authErrorAction);

      fixture.authError();

      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith(authErrorAction)).to.be.true;
    });
  });

  describe("http error", () => {
    it("sends an http error action to the store", () => {
      const message = "homework should be done";
      const httpErrorAction = {
        e: "is for error, that's good enough for me"
      };
      httpErrorActionCreator.withArgs(message).returns(httpErrorAction);

      fixture.httpError(message);

      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith(httpErrorAction)).to.be.true;
    });
    
    it("has alertError as a synonym", () => {
      const message = "homework should be done";
      const httpErrorAction = {
        e: "is for error, that's good enough for me"
      };
      httpErrorActionCreator.withArgs(message).returns(httpErrorAction);

      fixture.alertError(message);

      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith(httpErrorAction)).to.be.true;
    });
  });

  describe("alert success", () => {
    it("sends an http success action to the store", () => {
      const message = "spell the word";
      const httpSuccessAction = {
        status: "is very successful"
      };
      httpSuccessActionCreator.withArgs(message).returns(httpSuccessAction);

      fixture.alertSuccess(message);

      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith(httpSuccessAction)).to.be.true;
    });
  });

  describe("set stale", () => {
    it("sends a set stale action to the store", () => {
      const setStaleAction = {
        press: "up, or down if you like"
      };
      setStaleActionCreator.withArgs().returns(setStaleAction);

      fixture.setStale();

      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith(setStaleAction)).to.be.true;
    });
  });

  describe("clear", () => {
    it("sends a clear action to the store", () => {
      const clearAction = {
        monster: "truck racing"
      };
      clearActionCreator.withArgs().returns(clearAction);

      fixture.clear();

      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith(clearAction)).to.be.true;
    });
  });
});
