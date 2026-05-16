import ky from 'ky';

/**
 * Vite 환경변수에서 API 서버 주소를 읽습니다.
 *
 * .env 예시:
 * VITE_API_URL=/api
 * VITE_API_URL=https://sketch-room-server.onrender.com
 *
 * 값이 비어 있으면 로컬 개발에서 Vite proxy를 탈 수 있도록 /api를 기본값으로 사용합니다.
 */
const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || '/api';

/**
 * 앱 전체에서 공유해서 사용할 ky 인스턴스입니다.
 *
 * 이 client는 공통 transport 설정만 담당합니다.
 * x-guest-id 같은 도메인별 헤더, endpoint별 request/response 타입,
 * React Query key 설계는 실제 기능을 붙이는 파일에서 개별로 처리합니다.
 */
export const apiClient = ky.create({
  /**
   * ky v2에서는 prefixUrl 대신 prefix/baseUrl을 사용합니다.
   * prefix는 'rooms'와 '/rooms' 모두 같은 방식으로 base URL 뒤에 붙여주기 때문에
   * endpoint 작성 실수를 줄이기 좋습니다.
   */
  prefix: apiBaseUrl,
  headers: {
    /**
     * 서버가 JSON envelope를 내려주는 API라는 의도를 명시합니다.
     * body 전송 시 Content-Type은 ky의 json 옵션을 쓰면 자동으로 설정됩니다.
     */
    Accept: 'application/json',
  },
  /**
   * 너무 오래 걸리는 요청은 사용자에게 실패 상태를 보여줄 수 있도록 중단합니다.
   */
  timeout: 10_000,
  /**
   * 사용자 액션 API에서 의도치 않은 중복 요청을 피하기 위해 자동 재시도는 꺼둡니다.
   * 필요한 조회성 API가 생기면 호출부에서 retry를 개별 override할 수 있습니다.
   */
  retry: {
    limit: 0,
  },
});
