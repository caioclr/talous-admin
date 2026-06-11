import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAuditor,
  getIntermediario,
  getParticipantesSyncStatus,
  listAdmCarteira,
  listAuditores,
  listIntermediarios,
  triggerParticipantesSync,
} from "@/lib/services/admin/cvm-participantes";
import { setAccessToken } from "@/lib/services/client";

describe("cvm-participantes service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken("test-token");
  });

  afterEach(() => {
    setAccessToken(null);
  });

  function mockOk(payload: unknown) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("builds auditores URL with full filter set", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listAuditores({
      situacao: "ATIVO",
      tipo: "PJ",
      page: 2,
      page_size: 25,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/participantes/auditores?situacao=ATIVO&tipo=PJ&page=2&page_size=25",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds auditor detail URL by cd_cvm with tipo", async () => {
    const fetchMock = mockOk({});

    await getAuditor(4189, { tipo: "PF" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/participantes/auditores/4189?tipo=PF",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds intermediarios URL with situacao + tipo_participante", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listIntermediarios({
      situacao: "EM FUNCIONAMENTO NORMAL",
      tipo_participante: "CORRETORA",
      page: 1,
      page_size: 25,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/participantes/intermediarios?situacao=EM+FUNCIONAMENTO+NORMAL&tipo_participante=CORRETORA&page=1&page_size=25",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds intermediario detail URL by cnpj", async () => {
    const fetchMock = mockOk({});

    await getIntermediario("02332886000104");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/participantes/intermediarios/02332886000104",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds adm-carteira URL with situacao + categoria_registro", async () => {
    const fetchMock = mockOk({
      items: [],
      pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 },
    });

    await listAdmCarteira({
      situacao: "ATIVO",
      categoria_registro: "Pessoa Juridica",
      page: 3,
      page_size: 10,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/participantes/adm-carteira?situacao=ATIVO&categoria_registro=Pessoa+Juridica&page=3&page_size=10",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("hits sync-status endpoint", async () => {
    const fetchMock = mockOk({});

    await getParticipantesSyncStatus();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/participantes/sync-status",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("POSTs sync trigger with dataset + force", async () => {
    const fetchMock = mockOk({
      task_id: "task-participantes-1",
      status: "queued",
      dataset: "intermed",
    });

    await triggerParticipantesSync({ dataset: "intermed", force: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8001/api/v1/admin/cvm/participantes/sync?dataset=intermed&force=true",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
