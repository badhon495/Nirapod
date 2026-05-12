import { http, HttpResponse } from "msw";

const API = "http://localhost:8080/api/v1";

export const handlers = [
  http.get(`${API}/complaints/:id/follow`, () => {
    return HttpResponse.json({ following: false, followerCount: 3 });
  }),

  http.post(`${API}/complaints/:id/follow`, () => {
    return HttpResponse.json({ following: true, followerCount: 4 });
  }),

  http.delete(`${API}/complaints/:id/follow`, () => {
    return HttpResponse.json({ following: false, followerCount: 3 });
  }),

  http.get(`${API}/complaints`, () => {
    return HttpResponse.json({
      content: [
        {
          id: "complaint-1",
          trackingId: 1001,
          title: "Broken streetlight on Main Road",
          category: "CITY",
          urgency: "MEDIUM",
          status: "UNSOLVED",
          district: "Dhaka",
          area: "Mirpur",
          photoCount: 2,
          followCount: 5,
          commentCount: 3,
          createdAt: "2026-01-15T10:00:00Z",
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
    });
  }),

  http.get(`${API}/notifications/unread-count`, () => {
    return HttpResponse.json({ count: 0 });
  }),
];
